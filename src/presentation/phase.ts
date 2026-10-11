import type { MoonPhase } from '../phase.js';

export function formatMoonPhase(phase: MoonPhase): string {
    return `${phase.illumination.toFixed(1)}% – ${phase.phase} (${phase.trend})`;
}
