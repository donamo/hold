import { calculateMoonPhase } from './phase.js';
import { calculateMoonPosition } from './moon.js';
import { altitudeLabel, directionLabel } from './format.js';
import type { Coordinates } from './types.js';

const TIME_ZONE = 'Europe/Budapest';
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const RAD = Math.PI / 180;
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});
const timeFormatter = new Intl.DateTimeFormat('hu-HU', {
    timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function localDate(date: Date): string {
    const parts = dateFormatter.formatToParts(date);
    const part = (type: string) => parts.find(value => value.type === type)!.value;
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

/** Today's evening in Budapest time, starting at sunset in one-hour steps. */
export function formatEveningTable(coordinates: Coordinates, now: Date): string {
    // Use the same input validation as the position calculator.
    calculateMoonPosition(coordinates, now);
    const today = localDate(now);
    return formatDayTable(coordinates, today, 'Ma naplemente után');
}

function formatDayTable(coordinates: Coordinates, today: string, label: string): string {
    const sunset = sunsetOnDay(new Date(`${today}T00:00:00Z`), coordinates);
    const heading = `${label} – ${today} (${TIME_ZONE})`;
    if (!sunset) return `${heading}\nEzen a napon nincs naplemente.`;

    const rows: string[][] = [['Időpont', 'Égtáj', 'Azimut', 'Magasság', 'Elhelyezkedés', 'Megvilágítottság', 'Holdfázis', 'Változás']];
    for (let timestamp = sunset.getTime(); localDate(new Date(timestamp)) === today; timestamp += HOUR) {
        const date = new Date(timestamp);
        const position = calculateMoonPosition(coordinates, date);
        const phase = calculateMoonPhase(date);
        rows.push([
            timeFormatter.format(date), directionLabel(position.azimuth),
            `${position.azimuth.toFixed(2)}°`, `${position.altitude.toFixed(2)}°`,
            altitudeLabel(position.altitude),
            `${phase.illumination.toFixed(1)}%`, phase.phase, phase.trend,
        ]);
    }
    const widths = rows[0]!.map((_, column) => Math.max(...rows.map(row => row[column]!.length)));
    const lines = rows.map(row => row.map((cell, column) => cell.padEnd(widths[column]!)).join(' | ').trimEnd());
    lines.splice(1, 0, widths.map(width => '-'.repeat(width)).join('-+-'));
    return `${heading}\nNaplemente: kb. ${timeFormatter.format(sunset)}; óránként innen, éjfélig.\n\n${lines.join('\n')}`;
}

/** Read the optional CLI setting; reject partial numbers and unreasonable output sizes. */
export function parseForecastDays(value: string | undefined): number {
    if (value === undefined) return 7;
    const trimmed = value.trim();
    const days = Number(trimmed);
    if (!/^\d+$/.test(trimmed) || !Number.isInteger(days) || days < 1 || days > 365) {
        throw new RangeError('A FORECAST_DAYS értéke 1 és 365 közötti egész szám legyen.');
    }
    return days;
}

/** Consecutive Budapest calendar days, including today. */
export function formatEveningForecast(coordinates: Coordinates, now: Date, days = 7): string {
    calculateMoonPosition(coordinates, now);
    parseForecastDays(String(days));
    // Advance calendar dates at UTC midnight, not local instants across DST changes.
    const firstDay = new Date(`${localDate(now)}T00:00:00Z`);
    return Array.from({ length: days }, (_, index) => {
        const day = new Date(firstDay.getTime() + index * DAY).toISOString().slice(0, 10);
        return formatDayTable(coordinates, day, index === 0 ? 'Ma naplemente után' : 'Naplemente után');
    }).join('\n\n');
}
