import { calculateMoonPhase } from './moon/phase.js';
import type { MoonPhase } from './moon/phase.js';
import { calculateMoonPosition } from './moon/position.js';
import { t } from './i18n/translate.js';
import { assertValidCoordinates, assertValidDate } from './validation.js';
import type { Coordinates, MoonPosition } from './types.js';

/** Calendar days and evening hours are counted in this time zone. */
export const FORECAST_TIME_ZONE = 'Europe/Budapest';
export const DEFAULT_FORECAST_DAYS = 7;
const MAX_FORECAST_DAYS = 365;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const RAD = Math.PI / 180;
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: FORECAST_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});

export interface EveningObservation {
    time: Date;
    position: MoonPosition;
    phase: MoonPhase;
}

export interface EveningForecastDay {
    /** Calendar day in FORECAST_TIME_ZONE, formatted as YYYY-MM-DD. */
    date: string;
    /** Null when the sun does not set that day (polar day or night); observations are then empty. */
    sunset: Date | null;
    /** Hourly from sunset until local midnight. */
    observations: EveningObservation[];
}

function localDate(date: Date): string {
    const parts = dateFormatter.formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes): string => {
        const value = parts.find(candidate => candidate.type === type)?.value;
        if (value === undefined) throw new Error(`Missing ${type} in formatted ${FORECAST_TIME_ZONE} date.`);
        return value;
    };
    return `${part('year')}-${part('month')}-${part('day')}`;
}

/** Approximate sunset using NOAA's fractional-year equations.
 * https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 * The input is the calendar day represented at UTC midnight.
 */
function sunsetOnDay(day: Date, { latitude, longitude }: Coordinates): Date | null {
    const year = day.getUTCFullYear();
    const yearStart = Date.UTC(year, 0, 1);
    const daysInYear = (Date.UTC(year + 1, 0, 1) - yearStart) / DAY;
    const gamma = 2 * Math.PI / daysInYear * ((day.getTime() - yearStart) / DAY);
    const equationOfTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma)
        - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma)
        - 0.040849 * Math.sin(2 * gamma));
    const declination = 0.006918 - 0.399912 * Math.cos(gamma)
        + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma)
        + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma)
        + 0.00148 * Math.sin(3 * gamma);
    const cosine = Math.cos(90.833 * RAD) / (Math.cos(latitude * RAD) * Math.cos(declination))
        - Math.tan(latitude * RAD) * Math.tan(declination);
    if (cosine < -1 || cosine > 1) return null;
    const hourAngle = Math.acos(cosine) / RAD;
    const minutes = 720 - 4 * (longitude - hourAngle) - equationOfTime;
    return new Date(day.getTime() + minutes * 60_000);
}

function calculateEveningDay(coordinates: Coordinates, date: string): EveningForecastDay {
    const sunset = sunsetOnDay(new Date(`${date}T00:00:00Z`), coordinates);
    const observations: EveningObservation[] = [];
    if (sunset) {
        for (let timestamp = sunset.getTime(); localDate(new Date(timestamp)) === date; timestamp += HOUR) {
            const time = new Date(timestamp);
            observations.push({
                time,
                position: calculateMoonPosition(coordinates, time),
                phase: calculateMoonPhase(time),
            });
        }
    }
    return { date, sunset, observations };
}

/** Read the optional CLI setting; reject partial numbers and unreasonable output sizes. */
export function parseForecastDays(value: string | undefined): number {
    if (value === undefined) return DEFAULT_FORECAST_DAYS;
    const trimmed = value.trim();
    // Reject partial numbers such as "7days" or "1.5" that Number() would accept or coerce.
    if (!/^\d+$/.test(trimmed)) throw forecastDaysError();
    const days = Number(trimmed);
    assertValidForecastDays(days);
    return days;
}

function assertValidForecastDays(days: number): void {
    if (!Number.isInteger(days) || days < 1 || days > MAX_FORECAST_DAYS) throw forecastDaysError();
}

function forecastDaysError(): RangeError {
    return new RangeError(t`A FORECAST_DAYS értéke 1 és ${MAX_FORECAST_DAYS} közötti egész szám legyen.`);
}

/** Consecutive Budapest calendar days, including today. */
export function calculateEveningForecast(
    coordinates: Coordinates, now: Date, days = DEFAULT_FORECAST_DAYS,
): EveningForecastDay[] {
    assertValidCoordinates(coordinates);
    assertValidDate(now);
    assertValidForecastDays(days);
    // Advance calendar dates at UTC midnight, not local instants across DST changes.
    const firstDay = new Date(`${localDate(now)}T00:00:00Z`);
    return Array.from({ length: days }, (_, index) => {
        const day = new Date(firstDay.getTime() + index * DAY).toISOString().slice(0, 10);
        return calculateEveningDay(coordinates, day);
    });
}
