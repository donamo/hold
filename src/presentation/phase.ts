import { translate } from '../i18n/translate.js';
import type { MoonPhase } from '../moon/phase.js';

export function formatMoonPhase(phase: MoonPhase): string {
    return `${phase.illumination.toFixed(1)}% – ${translate(phase.phase)} (${translate(phase.trend)})`;
}
