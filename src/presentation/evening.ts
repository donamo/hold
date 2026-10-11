import { calculateEveningForecast, DEFAULT_FORECAST_DAYS, FORECAST_TIME_ZONE } from '../evening.js';
import type { EveningForecastDay, EveningObservation } from '../evening.js';
import type { Coordinates } from '../types.js';
import { altitudeLabel, directionLabel } from './position.js';

const TABLE_HEADER = ['Időpont', 'Égtáj', 'Azimut', 'Magasság', 'Elhelyezkedés', 'Megvilágítottság', 'Holdfázis', 'Változás'] as const;

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

/** Consecutive Budapest calendar days, including today. */
export function formatEveningForecast(coordinates: Coordinates, now: Date, days = DEFAULT_FORECAST_DAYS): string {
    return calculateEveningForecast(coordinates, now, days)
        .map((day, index) => formatForecastDay(day, index === 0 ? ForecastDayHeading.Today : ForecastDayHeading.Following))
        .join('\n\n');
}

function formatForecastDay({ date, sunset, observations }: EveningForecastDay, label: ForecastDayHeading): string {
    const heading = `${label} – ${date} (${FORECAST_TIME_ZONE})`;
    if (!sunset) return `${heading}\nEzen a napon nincs naplemente.`;
    const table = renderTable(TABLE_HEADER, observations.map(formatObservationRow));
    return `${heading}\nNaplemente: kb. ${timeFormatter.format(sunset)}; óránként innen, éjfélig.\n\n${table}`;
}

function formatObservationRow({ time, position, phase }: EveningObservation): string[] {
    return [
        timeFormatter.format(time), directionLabel(position.azimuth),
        `${position.azimuth.toFixed(2)}°`, `${position.altitude.toFixed(2)}°`,
        altitudeLabel(position.altitude),
        `${phase.illumination.toFixed(1)}%`, phase.phase, phase.trend,
    ];
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
