import type { Coordinates } from './types.js';

// Error messages are part of the public contract (RangeError thrown by the API).
export function assertValidCoordinates({ latitude, longitude }: Coordinates): void {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        throw new RangeError('Latitude must be a finite number between -90 and 90.');
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new RangeError('Longitude must be a finite number between -180 and 180.');
    }
}

export function assertValidDate(date: Date): void {
    if (!(date instanceof Date) || !Number.isFinite(date.getTime())) {
        throw new RangeError('Date must be valid.');
    }
}
