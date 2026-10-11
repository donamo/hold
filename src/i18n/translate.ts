import { CATALOGS } from './catalogs.js';
import { DEFAULT_LOCALE } from './locale.js';
import type { Locale } from './locale.js';

type Placeholder = string | number;

// Module state, because the tagged template `t` has no room for a locale argument.
// Set it once at the program boundary (see cli.ts); translations are looked up
// when the text is built, not when the module is loaded.
let currentLocale: Locale = DEFAULT_LOCALE;

export function setLocale(locale: Locale): void {
    currentLocale = locale;
}

export function getLocale(): Locale {
    return currentLocale;
}

/** Run `action` in the given language and restore the previous one afterwards. */
export function withLocale<T>(locale: Locale, action: () => T): T {
    const previous = currentLocale;
    currentLocale = locale;
    try {
        return action();
    } finally {
        currentLocale = previous;
    }
}

/**
 * Translate a source text. Unknown texts are returned unchanged, so a missing
 * translation shows the Hungarian source instead of failing.
 * `{0}`, `{1}`, … in the (translated) text are replaced by `values`, which lets
 * a translation reorder them.
 */
export function translate(key: string, ...values: readonly Placeholder[]): string {
    const catalog = CATALOGS[currentLocale];
    const message = (Object.hasOwn(catalog, key) ? catalog[key] : undefined) ?? key;
    return message.replace(/\{(\d+)\}/g, (placeholder, index: string) => {
        const value = values[Number(index)];
        return value === undefined ? placeholder : String(value);
    });
}

/** Tagged template form: t`Naplemente: kb. ${time}` looks up "Naplemente: kb. {0}". */
export function t(strings: TemplateStringsArray, ...values: readonly Placeholder[]): string {
    const key = strings.slice(1).reduce((text, part, index) => `${text}{${index}}${part}`, strings[0] ?? '');
    return translate(key, ...values);
}
