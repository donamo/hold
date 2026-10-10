import { describe, expect, it } from 'vitest';
import { formatEveningTable, formatEveningForecast, parseForecastDays } from '../src/evening.js';

const budapest = { latitude: 47.5, longitude: 19 };

describe('evening table', () => {
    it('lists sunset and hourly positions until local midnight', () => {
        const table = formatEveningTable(budapest, new Date('2026-09-16T12:00:00Z'));
        const times = [...table.matchAll(/^(\d{2}):(\d{2})\s+\|/gm)]
            .map(match => Number(match[1]) * 60 + Number(match[2]));
        expect(times.length).toBeGreaterThan(0);
        expect(times[0]).toBeGreaterThan(18 * 60);
        expect(times[0]).toBeLessThan(20 * 60);
        for (let index = 1; index < times.length; index++) {
            expect(times[index]! - times[index - 1]!).toBe(60);
        }
        expect(times.at(-1)).toBeGreaterThanOrEqual(23 * 60);
        expect(times.at(-1)).toBeLessThan(24 * 60);
        expect(table).toContain('a horizont alatt');
    });

    it.each([
        ['2026-09-16T22:30:00Z', '2026-09-17'],
        ['2026-01-16T23:30:00Z', '2026-01-17'],
    ])('uses the Budapest calendar day at %s', (instant, day) => {
        expect(formatEveningTable(budapest, new Date(instant))).toContain(`– ${day} (Europe/Budapest)`);
    });

    it('keeps the whole evening even when run after sunset', () => {
        expect(formatEveningTable(budapest, new Date('2026-09-16T21:00:00Z')))
            .toBe(formatEveningTable(budapest, new Date('2026-09-16T08:00:00Z')));
    });
});

describe('multi-day forecast', () => {
    it('defaults to seven days including today across a year boundary', () => {
        const output = formatEveningForecast(budapest, new Date('2026-12-29T12:00:00Z'));
        const dates = [...output.matchAll(/– (\d{4}-\d{2}-\d{2})/g)].map(match => match[1]);
        expect(dates).toEqual(['2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03', '2027-01-04']);
    });

    it('advances calendar days across the end of daylight saving time', () => {
        const output = formatEveningForecast(budapest, new Date('2026-10-24T22:30:00Z'), 3);
        const dates = [...output.matchAll(/– (\d{4}-\d{2}-\d{2})/g)].map(match => match[1]);
        expect(dates).toEqual(['2026-10-25', '2026-10-26', '2026-10-27']);
    });

    it('supports a single day', () => {
        const now = new Date('2026-09-16T12:00:00Z');
        expect(formatEveningForecast(budapest, now, 1)).toBe(formatEveningTable(budapest, now));
    });

    it('parses the environment setting and its default', () => {
        expect(parseForecastDays(undefined)).toBe(7);
        expect(parseForecastDays('3')).toBe(3);
        expect(parseForecastDays('365')).toBe(365);
    });

    it.each(['', '0', '-1', '1.5', '7days', 'Infinity', '366'])('rejects invalid day count %j', value => {
        expect(() => parseForecastDays(value)).toThrow(/FORECAST_DAYS/);
    });

    it.each([0, -1, 1.5, 366, NaN])('rejects invalid day count argument %s', days => {
        expect(() => formatEveningForecast(budapest, new Date('2026-09-16T12:00:00Z'), days))
            .toThrow(/FORECAST_DAYS/);
    });

    it('rejects invalid coordinates and dates like the position API', () => {
        const now = new Date('2026-09-16T12:00:00Z');
        expect(() => formatEveningForecast({ latitude: 91, longitude: 19 }, now)).toThrow(/Latitude/);
        expect(() => formatEveningTable({ latitude: 47.5, longitude: 181 }, now)).toThrow(/Longitude/);
        expect(() => formatEveningTable(budapest, new Date('invalid'))).toThrow(/Date must be valid/);
    });
});
