import { describe, expect, it } from 'vitest';
import { calculateMoonPhase, formatMoonPhase } from '../src/moon.js';
import { formatEveningTable } from '../src/evening.js';

// Reference events: Fred Espenak's 2024 GMT almanac.
// https://www.astropixels.com/almanac/almanac21/almanac2024gmt.html
 describe('moon phase', () => {
    it.each([
        ['2024-04-08T18:21:00Z', 0, 'újhold körül'],
        ['2024-04-15T19:13:00Z', 50, 'első negyed körül'],
        ['2024-04-23T23:49:00Z', 100, 'telihold körül'],
        ['2024-05-01T11:27:00Z', 50, 'utolsó negyed körül'],
    ])('matches the reference phase at %s within one percentage point', (date, expected, label) => {
        const result = calculateMoonPhase(new Date(date));
        expect(Math.abs(result.illumination - expected)).toBeLessThan(1);
        expect(result.phase).toBe(label);
    });

    it.each([
        ['2024-04-12T12:00:00Z', 'növekvő'],
        ['2024-04-27T12:00:00Z', 'fogyó'],
    ])('identifies the trend at %s', (date, trend) => {
        const result = calculateMoonPhase(new Date(date));
        const next = calculateMoonPhase(new Date(new Date(date).getTime() + 3600000));
        expect(result.trend).toBe(trend);
        expect(next.illumination > result.illumination).toBe(trend === 'növekvő');
    });

    it('rejects invalid dates', () => {
        expect(() => calculateMoonPhase(new Date(NaN))).toThrow(RangeError);
    });

    it('formats percentage and phase and includes them in the evening table', () => {
        const date = new Date('2024-04-12T12:00:00Z');
        expect(formatMoonPhase(calculateMoonPhase(date))).toMatch(/\d+\.\d% – növekvő holdsarló/);
        const table = formatEveningTable({ latitude: 47.5, longitude: 19 }, date);
        expect(table).toContain('Megvilágítottság');
        expect(table).toContain('Holdfázis');
        expect(table).toContain('növekvő holdsarló');
    });
});
