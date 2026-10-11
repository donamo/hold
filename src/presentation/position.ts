import type { MoonPosition } from '../types.js';
import { normalizeDegrees } from '../angle.js';

export enum CompassDirection {
    North = 'észak',
    NorthEast = 'északkelet',
    East = 'kelet',
    SouthEast = 'délkelet',
    South = 'dél',
    SouthWest = 'délnyugat',
    West = 'nyugat',
    NorthWest = 'északnyugat',
}

export enum AltitudeDescription {
    BelowHorizon = 'a horizont alatt',
    OnHorizon = 'a horizonton',
    Low = 'alacsonyan',
    Moderate = 'közepesen magasan',
    High = 'magasan',
    NearZenith = 'a zenit közelében',
}

/** Clockwise from north in 45° steps, indexed by the rounded azimuth sector. */
const COMPASS_SECTORS = [
    CompassDirection.North, CompassDirection.NorthEast, CompassDirection.East, CompassDirection.SouthEast,
    CompassDirection.South, CompassDirection.SouthWest, CompassDirection.West, CompassDirection.NorthWest,
] as const;

export function directionLabel(azimuth: number): CompassDirection {
    const index = Math.round(normalizeDegrees(azimuth) / 45) % COMPASS_SECTORS.length;
    const direction = COMPASS_SECTORS[index];
    if (direction === undefined) throw new Error(`No compass direction for azimuth ${azimuth}.`);
    return direction;
}

export function altitudeLabel(altitude: number): AltitudeDescription {
    if (altitude < 0) return AltitudeDescription.BelowHorizon;
    if (altitude === 0) return AltitudeDescription.OnHorizon;
    if (altitude < 10) return AltitudeDescription.Low;
    if (altitude < 45) return AltitudeDescription.Moderate;
    if (altitude < 80) return AltitudeDescription.High;
    return AltitudeDescription.NearZenith;
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
