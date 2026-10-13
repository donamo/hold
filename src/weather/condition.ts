/**
 * What the evening sky looks like. The values are the Hungarian source texts,
 * so they double as translation keys (see i18n/catalogs.ts).
 * The forecast only covers the evening after sunset, so clear weather means a starry sky.
 */
export enum WeatherCondition {
    StarryClear = 'csillagos égbolt',
    PartlyCloudy = 'részben felhős',
    Cloudy = 'felhős',
    Fog = 'ködös',
    Drizzle = 'szitálás',
    Rain = 'esős',
    Snow = 'havazás',
    Thunderstorm = 'zivatar',
}

/** Map a WMO weather interpretation code (https://open-meteo.com/en/docs); unknown codes give undefined. */
export function conditionFromWmoCode(code: number): WeatherCondition | undefined {
    switch (code) {
        case 0: case 1:
            return WeatherCondition.StarryClear;
        case 2:
            return WeatherCondition.PartlyCloudy;
        case 3:
            return WeatherCondition.Cloudy;
        case 45: case 48:
            return WeatherCondition.Fog;
        case 51: case 53: case 55: case 56: case 57:
            return WeatherCondition.Drizzle;
        case 61: case 63: case 65: case 66: case 67: case 80: case 81: case 82:
            return WeatherCondition.Rain;
        case 71: case 73: case 75: case 77: case 85: case 86:
            return WeatherCondition.Snow;
        case 95: case 96: case 99:
            return WeatherCondition.Thunderstorm;
        default:
            return undefined;
    }
}
