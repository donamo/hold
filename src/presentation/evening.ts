import { calculateEveningForecast, DEFAULT_FORECAST_DAYS, FORECAST_TIME_ZONE } from '../evening.js';
import type { EveningForecastDay, EveningObservation } from '../evening.js';
import type { Coordinates } from '../types.js';
import { t, translate } from '../i18n/translate.js';
import { conditionAt } from '../weather/forecast.js';
import type { HourlyWeather } from '../weather/forecast.js';
import { altitudeText, directionText } from './position.js';

enum ForecastDayHeading {
    Today = 'Ma naplemente után',
    Following = 'Naplemente után',
}

const timeFormatter = new Intl.DateTimeFormat('hu-HU', {
    timeZone: FORECAST_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

/** Today's evening in Budapest time, starting at sunset in one-hour steps. */
export function formatEveningTable(coordinates: Coordinates, now: Date): string {
    return formatEveningForecast(coordinates, now, 1);
}

/**
 * Consecutive Budapest calendar days, including today.
 * With `weather` the table gets a weather column; hours the forecast does not cover show a dash.
 */
export function formatEveningForecast(
    coordinates: Coordinates, now: Date, days = DEFAULT_FORECAST_DAYS, weather?: HourlyWeather,
): string {
    return calculateEveningForecast(coordinates, now, days)
        .map((day, index) => formatForecastDay(day, index === 0 ? ForecastDayHeading.Today : ForecastDayHeading.Following, weather))
        .join('\n\n');
}

/** Built on demand, because the language is chosen after this module is loaded. */
function tableHeader(withWeather: boolean): string[] {
    const header = [t`Időpont`, t`Égtáj`, t`Azimut`, t`Magasság`, t`Elhelyezkedés`, t`Megvilágítottság`, t`Holdfázis`, t`Változás`];
    return withWeather ? [...header, t`Időjárás`] : header;
}

function formatForecastDay(
    { date, sunset, observations }: EveningForecastDay, label: ForecastDayHeading, weather: HourlyWeather | undefined,
): string {
    const heading = `${translate(label)} – ${date} (${FORECAST_TIME_ZONE})`;
    if (!sunset) return `${heading}\n${t`Ezen a napon nincs naplemente.`}`;
    const table = renderTable(
        tableHeader(weather !== undefined),
        observations.map(observation => formatObservationRow(observation, weather)),
    );
    const sunsetLine = t`Naplemente: kb. ${timeFormatter.format(sunset)}; óránként innen, éjfélig.`;
    return `${heading}\n${sunsetLine}\n\n${table}`;
}

function formatObservationRow({ time, position, phase }: EveningObservation, weather: HourlyWeather | undefined): string[] {
    const row = [
        timeFormatter.format(time), directionText(position.azimuth),
        `${position.azimuth.toFixed(2)}°`, `${position.altitude.toFixed(2)}°`,
        altitudeText(position.altitude),
        `${phase.illumination.toFixed(1)}%`, translate(phase.phase), translate(phase.trend),
    ];
    if (weather === undefined) return row;
    const condition = conditionAt(weather, time);
    return [...row, condition === undefined ? '–' : translate(condition)];
}

/** Left-aligned plain-text table with a separator line under the header. */
function renderTable(header: readonly string[], rows: readonly (readonly string[])[]): string {
    const allRows = [header, ...rows];
    const widths = header.map((_, column) => Math.max(...allRows.map(row => row[column]?.length ?? 0)));
    const lines = allRows.map(row =>
        row.map((cell, column) => cell.padEnd(widths[column] ?? 0)).join(' | ').trimEnd());
    lines.splice(1, 0, widths.map(width => '-'.repeat(width)).join('-+-'));
    return lines.join('\n');
}
