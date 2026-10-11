/**
 * Public package entry point (`dist/moon.js`).
 * Moon calculations live in `moon/`, text output in `presentation/`.
 */

export type { Coordinates, MoonPosition } from './types.js';
export type { MoonPhase } from './moon/phase.js';
export { calculateMoonPosition } from './moon/position.js';
export { calculateMoonPhase, MoonPhaseName, MoonTrend } from './moon/phase.js';
export { formatMoonPosition } from './presentation/position.js';
export { formatMoonPhase } from './presentation/phase.js';
export { Locale } from './i18n/locale.js';
export { setLocale } from './i18n/translate.js';
