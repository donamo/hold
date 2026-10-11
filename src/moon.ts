/**
 * Public package entry point (`dist/moon.js`).
 * Calculations live in the domain modules, text output in `presentation/`.
 */

export type { Coordinates, MoonPosition } from './types.js';
export type { MoonPhase } from './phase.js';
export { calculateMoonPosition } from './position.js';
export { calculateMoonPhase, MoonPhaseName, MoonTrend } from './phase.js';
export { formatMoonPosition } from './presentation/position.js';
export { formatMoonPhase } from './presentation/phase.js';
export { Locale } from './i18n/locale.js';
export { setLocale } from './i18n/translate.js';
