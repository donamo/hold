import { describe, it, expect } from 'vitest';
import { calculateMoonPosition, formatMoonPosition } from '../src/moon.js';
import type { Coordinates, MoonPosition } from '../src/moon.js';
import { directionLabel } from '../src/format.js';

describe('calculateMoonPosition', () => {
    it('should return valid moon position for given coordinates and date', () => {
        const coordinates: Coordinates = { latitude: 47.5, longitude: 19.0 };
        const date = new Date('2026-09-10T00:00:00Z');

        const position = calculateMoonPosition(coordinates, date);

        expect(position).toBeDefined();
        expect(typeof position.azimuth).toBe('number');
        expect(typeof position.altitude).toBe('number');
        expect(typeof position.distance).toBe('number');
        expect(typeof position.parallax).toBe('number');
    });

    it('should return azimuth in range [0, 360)', () => {
        const coordinates: Coordinates = { latitude: 47.5, longitude: 19.0 };
        const date = new Date();

        const position = calculateMoonPosition(coordinates, date);

        expect(position.azimuth).toBeGreaterThanOrEqual(0);
        expect(position.azimuth).toBeLessThan(360);
    });

    it('should return altitude in range [-90, 90]', () => {
        const coordinates: Coordinates = { latitude: 47.5, longitude: 19.0 };
        const date = new Date();

        const position = calculateMoonPosition(coordinates, date);

        expect(position.altitude).toBeGreaterThanOrEqual(-90);
        expect(position.altitude).toBeLessThanOrEqual(90);
    });

    it('should return distance in reasonable range (350000-450000 km)', () => {
        const coordinates: Coordinates = { latitude: 47.5, longitude: 19.0 };
        const date = new Date();

        const position = calculateMoonPosition(coordinates, date);

        expect(position.distance).toBeGreaterThanOrEqual(350000);
        expect(position.distance).toBeLessThanOrEqual(450000);
    });

    it('should handle different dates', () => {
        const coordinates: Coordinates = { latitude: 0, longitude: 0 };
        const date1 = new Date('2024-01-01T00:00:00Z');
        const date2 = new Date('2024-06-15T12:00:00Z');

        const position1 = calculateMoonPosition(coordinates, date1);
        const position2 = calculateMoonPosition(coordinates, date2);

        expect(position1).not.toEqual(position2);
    });

    it('should handle different coordinates', () => {
        const date = new Date('2024-03-15T00:00:00Z');

        const budapest: Coordinates = { latitude: 47.5, longitude: 19.0 };
        const tokyo: Coordinates = { latitude: 35.68, longitude: 139.69 };
        const ny: Coordinates = { latitude: 40.71, longitude: -74.01 };

        const posBudapest = calculateMoonPosition(budapest, date);
        const posTokyo = calculateMoonPosition(tokyo, date);
        const posNy = calculateMoonPosition(ny, date);

        expect(posBudapest).not.toEqual(posTokyo);
        expect(posTokyo).not.toEqual(posNy);
    });
});

describe('formatMoonPosition', () => {
    it('should format moon position correctly', () => {
        const position: MoonPosition = {
            azimuth: 180.5,
            altitude: 45.25,
            distance: 385000,
            parallax: 0.016
        };

        const formatted = formatMoonPosition(position);

        expect(formatted).toContain('Azimuth:');
        expect(formatted).toContain('Altitude:');
        expect(formatted).toContain('Distance:');
        expect(formatted).toContain('Parallax:');
    });

    it('should return string with expected format', () => {
        const position: MoonPosition = {
            azimuth: 0,
            altitude: 0,
            distance: 0,
            parallax: 0
        };

        const formatted = formatMoonPosition(position);

        expect(formatted).toMatch(/Azimuth: 0\.00°/);
        expect(formatted).toMatch(/Altitude: 0\.00°/);
        expect(formatted).toMatch(/Distance: 0\.00 km/);
        expect(formatted).toMatch(/Parallax: 0\.0000°/);
    });
});
describe('input validation and regression', () => {
    it.each([
        { latitude: -91, longitude: 0 },
        { latitude: 91, longitude: 0 },
        { latitude: NaN, longitude: 0 },
        { latitude: 0, longitude: -181 },
        { latitude: 0, longitude: 181 },
        { latitude: 0, longitude: Infinity },
    ])('rejects invalid coordinates: %j', (coordinates) => {
        expect(() => calculateMoonPosition(coordinates, new Date())).toThrow(RangeError);
    });

    it('rejects an invalid date', () => {
        expect(() => calculateMoonPosition(
            { latitude: 47.5, longitude: 19 }, new Date('invalid'),
        )).toThrow(RangeError);
    });

    it('preserves distance and altitude with north-based azimuth', () => {
        const position = calculateMoonPosition(
            { latitude: 47.5, longitude: 19 }, new Date('2026-09-10T00:00:00Z'),
        );
        expect(position.azimuth).toBeCloseTo(39.47826780172738, 8);
        expect(position.altitude).toBeCloseTo(-22.08364529296175, 8);
        expect(position.distance).toBeCloseTo(390333.8485674592, 6);
        expect(position.parallax).toBeCloseTo(0.01633875579816935, 10);
    });

    it.each([-90, 90])('accepts latitude boundary %s', (latitude) => {
        const position = calculateMoonPosition(
            { latitude, longitude: 180 }, new Date('2026-09-10T00:00:00Z'),
        );
        expect(Number.isFinite(position.altitude)).toBe(true);
        expect(Number.isFinite(position.azimuth)).toBe(true);
    });
});

describe('directionLabel', () => {
    it.each([
        [0, 'észak'], [22.4, 'észak'], [22.5, 'északkelet'], [315, 'északnyugat'],
        [359.9, 'észak'], [-45, 'északnyugat'], [720 + 180, 'dél'],
    ])('labels azimuth %s as %s', (azimuth, label) => {
        expect(directionLabel(azimuth)).toBe(label);
    });
});
