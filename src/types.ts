export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface MoonPosition {
    azimuth: number;
    altitude: number;
    distance: number; // in km
    parallax: number; // in radians
}

