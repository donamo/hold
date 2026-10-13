import { FORECAST_TIME_ZONE } from '../evening.js';
import type { Coordinates } from '../types.js';
import { assertValidCoordinates } from '../validation.js';
import { conditionFromWmoCode } from './condition.js';
import type { WeatherCondition } from './condition.js';

// Open-Meteo is free and needs no API key (non-commercial use). https://open-meteo.com/en/docs
const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
/** The API rejects longer ranges. */
export const MAX_WEATHER_DAYS = 16;
const REQUEST_TIMEOUT_MS = 5_000;

/** Sky conditions keyed by local hour, "YYYY-MM-DDTHH" in FORECAST_TIME_ZONE. */
export type HourlyWeather = ReadonlyMap<string, WeatherCondition>;

const hourFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: FORECAST_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
});

function hourKey(time: Date): string {
    const parts = hourFormatter.formatToParts(time);
    const part = (type: Intl.DateTimeFormatPartTypes): string => {
        const value = parts.find(candidate => candidate.type === type)?.value;
        if (value === undefined) throw new Error(`Missing ${type} in formatted ${FORECAST_TIME_ZONE} time.`);
        return value;
    };
    return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}`;
}

/** The conditions during the local hour that contains `time`; undefined when the forecast does not cover it. */
export function conditionAt(weather: HourlyWeather, time: Date): WeatherCondition | undefined {
    return weather.get(hourKey(time));
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

/** Validate the response body; TypeScript types say nothing about what the server really sent. */
function parseHourlyWeather(body: unknown): HourlyWeather {
    const hourly = isRecord(body) ? body.hourly : undefined;
    if (!isRecord(hourly) || !Array.isArray(hourly.time) || !Array.isArray(hourly.weather_code)) {
        throw new Error('Unexpected Open-Meteo response.');
    }
    const times: unknown[] = hourly.time;
    const codes: unknown[] = hourly.weather_code;
    const weather = new Map<string, WeatherCondition>();
    times.forEach((time, index) => {
        const code = codes[index];
        if (typeof time !== 'string' || typeof code !== 'number') return;
        const condition = conditionFromWmoCode(code);
        if (condition !== undefined) weather.set(time.slice(0, 13), condition);
    });
    return weather;
}

/**
 * Hourly sky conditions from today (FORECAST_TIME_ZONE) for up to MAX_WEATHER_DAYS days.
 * Rejects on network, HTTP or format errors; the caller decides whether to go on without weather.
 */
export async function fetchHourlyWeather(
    { latitude, longitude }: Coordinates, days: number, fetchImpl: typeof fetch = fetch,
): Promise<HourlyWeather> {
    assertValidCoordinates({ latitude, longitude });
    const url = new URL(ENDPOINT);
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('hourly', 'weather_code');
    url.searchParams.set('timezone', FORECAST_TIME_ZONE);
    url.searchParams.set('forecast_days', String(Math.min(Math.max(days, 1), MAX_WEATHER_DAYS)));
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`Open-Meteo responded with HTTP ${response.status}.`);
    return parseHourlyWeather(await response.json());
}
