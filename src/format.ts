import type { MoonPosition } from './types.js';

const DIRECTIONS = ['észak', 'északkelet', 'kelet', 'délkelet', 'dél', 'délnyugat', 'nyugat', 'északnyugat'] as const;

export function directionLabel(azimuth: number): string {
    const normalized = ((azimuth % 360) + 360) % 360;
    return DIRECTIONS[Math.round(normalized / 45) % 8]!;
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
