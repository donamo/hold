import { normalizeDegrees } from './angle.js';
import { assertValidDate } from './validation.js';

export interface MoonPhase {
    /** Illuminated fraction of the apparent lunar disk, from 0 to 100. */
    illumination: number;
    phase: string;
    trend: 'növekvő' | 'fogyó';
}

const RAD = Math.PI / 180;

/** Meeus 48.4 approximation, independent of the legacy position calculation.
 * Public-domain reference implementation by Greg Miller:
 * https://www.celestialprogramming.com/meeus-illuminated_fraction_of_the_moon.html
 */
export function calculateMoonPhase(date: Date): MoonPhase {
    assertValidDate(date);
    const t = (date.getTime() / 86_400_000 + 2440587.5 - 2451545) / 36525;
    const elongation = normalizeDegrees(297.8501921 + 445267.1114034 * t - 0.0018819 * t ** 2
        + t ** 3 / 545868 - t ** 4 / 113065000) * RAD;
    const sunAnomaly = normalizeDegrees(357.5291092 + 35999.0502909 * t - 0.0001536 * t ** 2
        + t ** 3 / 24490000) * RAD;
    const moonAnomaly = normalizeDegrees(134.9633964 + 477198.8675055 * t + 0.0087414 * t ** 2
        + t ** 3 / 69699 - t ** 4 / 14712000) * RAD;
    const phaseAngle = 180 - elongation / RAD - 6.289 * Math.sin(moonAnomaly)
        + 2.1 * Math.sin(sunAnomaly) - 1.274 * Math.sin(2 * elongation - moonAnomaly)
        - 0.658 * Math.sin(2 * elongation) - 0.214 * Math.sin(2 * moonAnomaly)
        - 0.11 * Math.sin(elongation);
    const illumination = (1 + Math.cos(phaseAngle * RAD)) * 50;
    const waxing = normalizeDegrees(180 - phaseAngle) < 180;
    const trend = waxing ? 'növekvő' : 'fogyó';
    let phase: string;
    if (illumination <= 1) phase = 'újhold körül';
    else if (illumination >= 99) phase = 'telihold körül';
    else if (Math.abs(illumination - 50) <= 1) phase = waxing ? 'első negyed körül' : 'utolsó negyed körül';
    else if (illumination < 50) phase = waxing ? 'növekvő holdsarló' : 'fogyó holdsarló';
    else phase = waxing ? 'növekvő domború hold' : 'fogyó domború hold';
    return { illumination, phase, trend };
}

export function formatMoonPhase(phase: MoonPhase): string {
    return `${phase.illumination.toFixed(1)}% – ${phase.phase} (${phase.trend})`;
}
