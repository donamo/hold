import { calculateMoonPosition, formatMoonPosition, calculateMoonPhase, formatMoonPhase } from './moon.js';
import { parseForecastDays } from './evening.js';
import { LOCALE_ENV_VAR, parseLocale } from './i18n/locale.js';
import { setLocale, t } from './i18n/translate.js';
import { formatEveningForecast } from './presentation/evening.js';
import { fetchHourlyWeather } from './weather/forecast.js';
import type { HourlyWeather } from './weather/forecast.js';
import type { Coordinates } from './types.js';

/** The weather is a nice-to-have: without network the moon tables are still printed. */
async function loadWeather(coordinates: Coordinates, days: number): Promise<HourlyWeather | undefined> {
    try {
        return await fetchHourlyWeather(coordinates, days);
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        console.error(t`Az időjárás-előrejelzés nem érhető el (${reason}), ezért az Időjárás oszlop kimarad.`);
        return undefined;
    }
}

try {
    setLocale(parseLocale(process.env[LOCALE_ENV_VAR]));
    const days = parseForecastDays(process.env.FORECAST_DAYS);
    const budapest = { latitude: 47.5, longitude: 19.0 };
    const weather = await loadWeather(budapest, days);
    const now = new Date();
    console.log(`${t`Jelenleg`}\n`);
    console.log(formatMoonPosition(calculateMoonPosition(budapest, now)));
    console.log(`${t`Megvilágítottság`}: ${formatMoonPhase(calculateMoonPhase(now))}`);
    console.log(`\n${formatEveningForecast(budapest, now, days, weather)}`);
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
