import { describe, expect, it } from 'vitest';
import { Locale } from '../src/moon.js';
import { withLocale } from '../src/i18n/translate.js';
import { formatEveningForecast } from '../src/presentation/evening.js';
import { conditionFromWmoCode, WeatherCondition } from '../src/weather/condition.js';
import { conditionAt, fetchHourlyWeather, MAX_WEATHER_DAYS } from '../src/weather/forecast.js';
import type { HourlyWeather } from '../src/weather/forecast.js';

const budapest = { latitude: 47.5, longitude: 19 };

function respondWith(body: unknown, init?: ResponseInit): { fetchImpl: typeof fetch; urls: URL[] } {
    const urls: URL[] = [];
    const fetchImpl: typeof fetch = async input => {
        urls.push(new URL(input instanceof Request ? input.url : input));
        return new Response(JSON.stringify(body), init);
    };
    return { fetchImpl, urls };
}

describe('conditionFromWmoCode', () => {
    it.each([
        [0, WeatherCondition.StarryClear],
        [1, WeatherCondition.StarryClear],
        [2, WeatherCondition.PartlyCloudy],
        [3, WeatherCondition.Cloudy],
        [45, WeatherCondition.Fog],
        [53, WeatherCondition.Drizzle],
        [63, WeatherCondition.Rain],
        [81, WeatherCondition.Rain],
        [73, WeatherCondition.Snow],
        [95, WeatherCondition.Thunderstorm],
    ])('maps WMO code %i to %s', (code, condition) => {
        expect(conditionFromWmoCode(code)).toBe(condition);
    });

    it.each([4, -1, 1.5, Number.NaN])('does not know code %s', code => {
        expect(conditionFromWmoCode(code)).toBeUndefined();
    });
});

describe('fetchHourlyWeather', () => {
    const body = {
        hourly: {
            time: ['2026-10-13T18:00', '2026-10-13T19:00', '2026-10-13T20:00', '2026-10-13T21:00', 7],
            weather_code: [0, 3, 63, 'x', 2],
        },
    };

    it('requests hourly weather codes in the forecast time zone and keys them by local hour', async () => {
        const { fetchImpl, urls } = respondWith(body);
        const weather = await fetchHourlyWeather(budapest, 3, fetchImpl);
        const url = urls[0];
        expect(url?.origin).toBe('https://api.open-meteo.com');
        expect(Object.fromEntries(url?.searchParams ?? [])).toEqual({
            latitude: '47.5', longitude: '19', hourly: 'weather_code', timezone: 'Europe/Budapest', forecast_days: '3',
        });
        // Entries with a malformed time or code are skipped, not guessed.
        expect([...weather]).toEqual([
            ['2026-10-13T18', WeatherCondition.StarryClear],
            ['2026-10-13T19', WeatherCondition.Cloudy],
            ['2026-10-13T20', WeatherCondition.Rain],
        ]);
    });

    it('asks for at most the number of days the API serves', async () => {
        const { fetchImpl, urls } = respondWith(body);
        await fetchHourlyWeather(budapest, 365, fetchImpl);
        expect(urls[0]?.searchParams.get('forecast_days')).toBe(String(MAX_WEATHER_DAYS));
    });

    it('rejects on HTTP errors, unexpected bodies and invalid coordinates', async () => {
        await expect(fetchHourlyWeather(budapest, 1, respondWith({ error: true }, { status: 400 }).fetchImpl))
            .rejects.toThrow('HTTP 400');
        await expect(fetchHourlyWeather(budapest, 1, respondWith({ hourly: { time: [] } }).fetchImpl))
            .rejects.toThrow('Unexpected Open-Meteo response');
        await expect(fetchHourlyWeather(budapest, 1, respondWith(null).fetchImpl))
            .rejects.toThrow('Unexpected Open-Meteo response');
        await expect(fetchHourlyWeather({ latitude: 91, longitude: 0 }, 1, respondWith(body).fetchImpl))
            .rejects.toThrow();
    });
});

describe('conditionAt', () => {
    const weather: HourlyWeather = new Map([['2026-10-13T18', WeatherCondition.Cloudy]]);

    it('finds the Budapest hour that contains the instant, in summer and winter time', () => {
        expect(conditionAt(weather, new Date('2026-10-13T16:30:00Z'))).toBe(WeatherCondition.Cloudy);
        expect(conditionAt(new Map([['2026-01-13T18', WeatherCondition.Snow]]), new Date('2026-01-13T17:59:00Z')))
            .toBe(WeatherCondition.Snow);
        expect(conditionAt(weather, new Date('2026-10-13T17:00:00Z'))).toBeUndefined();
    });
});

describe('forecast table with weather', () => {
    const now = new Date('2026-09-16T12:00:00Z');
    const hours = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
    // Only the first day is covered: cloudy all evening, rain at 20:00.
    const weather: HourlyWeather = new Map(hours.map(hour =>
        [`2026-09-16T${hour}`, hour === '20' ? WeatherCondition.Rain : WeatherCondition.Cloudy]));

    const [firstDay = '', secondDay = ''] = formatEveningForecast(budapest, now, 2, weather).split(/\n\n(?=Naplemente után)/);
    const rows = (day: string): string[] => day.split('\n').filter(line => /^\d{2}:\d{2}\s+\|/.test(line));

    it('adds a weather column with the expected sky per hour', () => {
        expect(firstDay).toMatch(/\| Időjárás$/m);
        expect(rows(firstDay).find(row => row.startsWith('20:'))).toMatch(/\| esős$/);
        expect(rows(firstDay).find(row => row.startsWith('21:'))).toMatch(/\| felhős$/);
    });

    it('shows a dash where the forecast does not reach', () => {
        expect(rows(secondDay).length).toBeGreaterThan(0);
        for (const row of rows(secondDay)) expect(row).toMatch(/\| –$/);
    });

    it('translates the column and the conditions', () => {
        withLocale(Locale.English, () => {
            const output = formatEveningForecast(budapest, now, 1, weather);
            expect(output).toMatch(/\| Weather$/m);
            expect(output).toMatch(/\| rainy$/m);
            expect(output).toMatch(/\| cloudy$/m);
        });
    });

    it('leaves the table unchanged when there is no weather', () => {
        const plain = formatEveningForecast(budapest, now, 1);
        expect(plain).not.toContain('Időjárás');
        expect(rows(plain).every(row => !row.endsWith('felhős'))).toBe(true);
    });
});
