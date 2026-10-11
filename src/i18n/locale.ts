export enum Locale {
    Hungarian = 'hu',
    English = 'en',
}

export const DEFAULT_LOCALE = Locale.Hungarian;
export const LOCALE_ENV_VAR = 'HOLD_LANG';

/**
 * Read the optional language setting. Unset means the default; any other
 * unsupported value is rejected. The message is bilingual because it is
 * shown before a language has been chosen.
 */
export function parseLocale(value: string | undefined): Locale {
    if (value === undefined) return DEFAULT_LOCALE;
    const normalized = value.trim().toLowerCase();
    const locale = Object.values(Locale).find(candidate => candidate === normalized);
    if (locale === undefined) {
        const supported = Object.values(Locale).join(', ');
        throw new RangeError(`A ${LOCALE_ENV_VAR} értéke ezek egyike legyen: ${supported}. / ${LOCALE_ENV_VAR} must be one of: ${supported}.`);
    }
    return locale;
}
