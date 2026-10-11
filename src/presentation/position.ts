import type { MoonPosition } from '../types.js';
import { normalizeDegrees } from '../angle.js';

const DIRECTIONS = ['észak', 'északkelet', 'kelet', 'délkelet', 'dél', 'délnyugat', 'nyugat', 'északnyugat'] as const;

export function directionLabel(azimuth: number): string {
    const index = Math.round(normalizeDegrees(azimuth) / 45) % DIRECTIONS.length;
    const label = DIRECTIONS[index];
    if (label === undefined) throw new Error(`No compass direction for azimuth ${azimuth}.`);
    return label;
}

export function altitudeLabel(altitude: number): string {
    if (altitude < 0) return 'a horizont alatt';
    if (altitude === 0) return 'a horizonton';
    if (altitude < 10) return 'alacsonyan';
    if (altitude < 45) return 'közepesen magasan';
    if (altitude < 80) return 'magasan';
    return 'a zenit közelében';
}

/** Format angles in degrees and distance in kilometers. */
export function formatMoonPosition(position: MoonPosition): string {
    return [
        `Azimuth: ${position.azimuth.toFixed(2)}° (${directionLabel(position.azimuth)})`,
        `Altitude: ${position.altitude.toFixed(2)}° (${altitudeLabel(position.altitude)})`,
        `Distance: ${position.distance.toFixed(2)} km`,
        `Parallax: ${(position.parallax * 180 / Math.PI).toFixed(4)}°`,
    ].join('\n');
}
