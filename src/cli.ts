import { calculateMoonPosition, formatMoonPosition, calculateMoonPhase, formatMoonPhase } from './moon.js';
import { parseForecastDays } from './evening.js';
import { LOCALE_ENV_VAR, parseLocale } from './i18n/locale.js';
import { setLocale, t } from './i18n/translate.js';
import { formatEveningForecast } from './presentation/evening.js';

try {
    setLocale(parseLocale(process.env[LOCALE_ENV_VAR]));
    const days = parseForecastDays(process.env.FORECAST_DAYS);
    const budapest = { latitude: 47.5, longitude: 19.0 };
    const now = new Date();
    console.log(`${t`Jelenleg`}\n`);
    console.log(formatMoonPosition(calculateMoonPosition(budapest, now)));
    console.log(`${t`Megvilágítottság`}: ${formatMoonPhase(calculateMoonPhase(now))}`);
    console.log(`\n${formatEveningForecast(budapest, now, days)}`);
} catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
}
