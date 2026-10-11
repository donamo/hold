import { describe, expect, it } from 'vitest';
import { Locale, calculateMoonPhase, calculateMoonPosition, formatMoonPhase, formatMoonPosition, MoonPhaseName, MoonTrend } from '../src/moon.js';
import { parseForecastDays } from '../src/evening.js';
import { DEFAULT_LOCALE, parseLocale } from '../src/i18n/locale.js';
import { getLocale, t, translate, withLocale } from '../src/i18n/translate.js';
import { formatEveningForecast } from '../src/presentation/evening.js';
import { AltitudeDescription, CompassDirection } from '../src/presentation/position.js';

const budapest = { latitude: 47.5, longitude: 19 };
const HUNGARIAN_LETTERS = /[áéíóöőúüű]/i;

describe('translate and t', () => {
    it('defaults to Hungarian and leaves the source text unchanged', () => {
        expect(DEFAULT_LOCALE).toBe(Locale.Hungarian);
        expect(getLocale()).toBe(Locale.Hungarian);
        expect(t`Jelenleg`).toBe('Jelenleg');
        expect(t`Naplemente: kb. ${'18:06'}; óránként innen, éjfélig.`)
            .toBe('Naplemente: kb. 18:06; óránként innen, éjfélig.');
    });

    it('translates plain and interpolated texts to English', () => {
        withLocale(Locale.English, () => {
            expect(t`Jelenleg`).toBe('Currently');
            expect(t`Naplemente: kb. ${'18:06'}; óránként innen, éjfélig.`)
                .toBe('Sunset: approx. 18:06; hourly from then until midnight.');
            expect(t`A FORECAST_DAYS értéke 1 és ${365} közötti egész szám legyen.`)
                .toBe('FORECAST_DAYS must be an integer between 1 and 365.');
        });
    });

    it('returns unknown texts unchanged and still fills their placeholders', () => {
        withLocale(Locale.English, () => {
            expect(translate('Ismeretlen szöveg')).toBe('Ismeretlen szöveg');
            expect(translate('{1} / {0}', 'a', 'b')).toBe('b / a');
            expect(translate('{0} és {1}', 'a')).toBe('a és {1}');
        });
    });

    it('does not mistake inherited object properties for translations', () => {
        withLocale(Locale.English, () => {
            expect(translate('constructor')).toBe('constructor');
            expect(translate('toString')).toBe('toString');
        });
    });

    it('does not re-expand placeholders inside interpolated values', () => {
        expect(translate('{0}', '{0}')).toBe('{0}');
        expect(translate('{0} {1}', '{1}', 'x')).toBe('{1} x');
    });

    it('restores the previous language after the action, even when it throws', () => {
        expect(() => withLocale(Locale.English, () => { throw new Error('boom'); })).toThrow('boom');
        expect(getLocale()).toBe(Locale.Hungarian);
    });
});

describe('parseLocale', () => {
    it.each([
        [undefined, Locale.Hungarian],
        ['hu', Locale.Hungarian],
        ['en', Locale.English],
        [' EN ', Locale.English],
    ])('reads %j as %s', (value, locale) => {
        expect(parseLocale(value)).toBe(locale);
    });

    it.each(['', 'de', 'en_US', 'english'])('rejects %j with a bilingual message', value => {
        expect(() => parseLocale(value)).toThrow(RangeError);
        expect(() => parseLocale(value)).toThrow(/HOLD_LANG.*\/.*HOLD_LANG/);
    });
});

describe('English catalog', () => {
    it.each([
        ...Object.values(MoonTrend),
        ...Object.values(MoonPhaseName),
        ...Object.values(CompassDirection),
        ...Object.values(AltitudeDescription),
    ])('has an English translation for the enum value "%s"', value => {
        const english = withLocale(Locale.English, () => translate(value));
        expect(english).not.toBe(value);
        expect(english).not.toMatch(HUNGARIAN_LETTERS);
    });

    it('leaves no Hungarian text in the English evening forecast', () => {
        withLocale(Locale.English, () => {
            // Ordinary days, plus a polar day without sunset.
            const output = [
                formatEveningForecast(budapest, new Date('2026-09-16T12:00:00Z'), 3),
                formatEveningForecast({ latitude: 80, longitude: 19 }, new Date('2026-06-21T12:00:00Z'), 1),
            ].join('\n');
            expect(output).not.toMatch(HUNGARIAN_LETTERS);
            expect(output).toContain('Today after sunset');
            expect(output).toContain('There is no sunset on this day.');
            expect(output).toContain('Time');
        });
    });

    it('leaves no Hungarian text in the English position and phase texts', () => {
        const date = new Date('2026-09-10T00:00:00Z');
        withLocale(Locale.English, () => {
            const output = `${formatMoonPosition(calculateMoonPosition(budapest, date))}\n${formatMoonPhase(calculateMoonPhase(date))}`;
            expect(output).not.toMatch(HUNGARIAN_LETTERS);
            expect(output).toContain('below the horizon');
        });
    });

    it('translates the FORECAST_DAYS error', () => {
        withLocale(Locale.English, () => {
            expect(() => parseForecastDays('0')).toThrow('FORECAST_DAYS must be an integer between 1 and 365.');
        });
    });
});
