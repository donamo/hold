/**
 * Moon Position Calculator
 * Calculates the position of the moon in the sky for a given location and time.
 */

import type { Coordinates, MoonPosition } from './types.js';
export type { Coordinates, MoonPosition } from './types.js';
export { formatMoonPosition } from './format.js';

interface JulianDate {
    jd: number;
    century: number;
}

// Constants
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const EARTH_RADIUS = 6378.137; // Earth radius in km

/**
 * Convert Date to Julian Date
 */
function dateToJulianDate(date: Date): JulianDate {
    const jd = date.getTime() / 86_400_000 + 2440587.5;

    return {
        jd,
        century: (jd - 2451545.0) / 36525.0
    };
}

/**
 * Normalize angle to [0, 360)
 */
function normalizeAngle(angle: number): number {
    return ((angle % 360) + 360) % 360;
}

/**
 * Calculate moon position using simplified astronomical algorithm
 */
export function calculateMoonPosition(
    coordinates: Coordinates,
    date: Date
): MoonPosition {
    validateInput(coordinates, date);
    const { latitude, longitude } = coordinates;
    const { jd, century } = dateToJulianDate(date);

    // Geometric longitude of the moon (degrees)
    const L0 = 218.316447 + 481267.881 * century;
    const D = 297.850192 + 445267.1115 * century;
    const M = 357.529109 + 35999.050291 * century;
    const F = 93.272076 + 483202.0177 * century;

    // Reduce to [0, 360)
    const L0Norm = normalizeAngle(L0);
    const DNorm = normalizeAngle(D);
    const MNorm = normalizeAngle(M);
    const FNorm = normalizeAngle(F);

    // Moon's ecliptic longitude and latitude corrections
    const lambda = L0Norm +
        6.289 * Math.sin(FNorm * DEG2RAD) +
        1.274 * Math.sin((2 * DNorm - FNorm) * DEG2RAD) +
        0.658 * Math.sin(2 * DNorm * DEG2RAD) +
        0.214 * Math.sin(2 * FNorm * DEG2RAD) -
        0.058 * Math.sin(DNorm * DEG2RAD);

    const beta =
        5.128 * Math.sin(FNorm * DEG2RAD) +
        0.658 * Math.sin(2 * FNorm * DEG2RAD);

    // Moon's ecliptic latitude
    const phi = beta;

    // Distance to the moon (in km)
    const distance = 385001 - 20905 * Math.cos(MNorm * DEG2RAD) -
        3699 * Math.cos((2 * DNorm - MNorm) * DEG2RAD) -
        2956 * Math.cos(2 * DNorm * DEG2RAD) -
        570.6 * Math.cos((2 * FNorm - MNorm) * DEG2RAD) +
        538 * Math.cos((2 * FNorm - MNorm) * DEG2RAD);

    // Obliquity of the ecliptic
    const epsilon = 23.439 - 0.0000004 * century;

    // Convert ecliptic coordinates to equatorial coordinates
    const lambdaRad = lambda * DEG2RAD;
    const phiRad = phi * DEG2RAD;
    const epsRad = epsilon * DEG2RAD;

    const rightAscension = Math.atan2(
        Math.sin(lambdaRad) * Math.cos(epsRad) - Math.tan(phiRad) * Math.sin(epsRad),
        Math.cos(lambdaRad)
    ) * RAD2DEG;

    const declination = Math.asin(
        Math.sin(phiRad) * Math.cos(epsRad) +
        Math.cos(phiRad) * Math.sin(epsRad) * Math.sin(lambdaRad)
    ) * RAD2DEG;

    // Greenwich Mean Sidereal Time (GMST)
    const gmst = 280.46061837 + 360.985647366 * (jd - 2451545.0) +
        0.00038793 * century * century;

    // Local hour angle
    const ha = normalizeAngle(gmst + longitude - rightAscension);

    // Convert to horizontal coordinates
    const latRad = latitude * DEG2RAD;
    const haRad = ha * DEG2RAD;
    const decRad = declination * DEG2RAD;

    const altitude = Math.asin(
        Math.sin(latRad) * Math.sin(decRad) +
        Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad)
    ) * RAD2DEG;

    // atan2(east, north): 0° north, 90° east, 180° south, 270° west.
    const azimuth = normalizeAngle(
        Math.atan2(
            -Math.sin(haRad),
            Math.tan(decRad) * Math.cos(latRad) - Math.sin(latRad) * Math.cos(haRad)
        ) * RAD2DEG
    );

    // Parallax correction
    const parallax = Math.atan(EARTH_RADIUS / distance);

    return {
        azimuth,
        altitude,
        distance,
        parallax
    };
}

function validateInput({ latitude, longitude }: Coordinates, date: Date): void {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        throw new RangeError('Latitude must be a finite number between -90 and 90.');
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new RangeError('Longitude must be a finite number between -180 and 180.');
    }
    if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
        throw new RangeError('Date must be valid.');
    }
}

export { calculateMoonPhase, formatMoonPhase } from './phase.js';
export type { MoonPhase } from './phase.js';
