/** Normalize an angle in degrees to [0, 360). */
export function normalizeDegrees(angle: number): number {
    return ((angle % 360) + 360) % 360;
}
