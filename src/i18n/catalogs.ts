import { Locale } from './locale.js';

/** Source text (the key) mapped to its translation. `{0}`, `{1}`, … mark interpolated values. */
export type Catalog = Readonly<Record<string, string>>;

/**
 * The keys are the Hungarian source texts used in the code, so the Hungarian
 * catalog is empty: a missing entry falls back to the key itself.
 * Keys that come from enum values (moon phase, compass direction, altitude
 * description, weather condition, forecast heading) must match those values exactly; the i18n
 * tests check that every one of them has an English entry.
 */
const english: Catalog = {
    'Jelenleg': 'Currently',
    'Megvilágítottság': 'Illumination',

    'Ma naplemente után': 'Today after sunset',
    'Naplemente után': 'After sunset',
    'Ezen a napon nincs naplemente.': 'There is no sunset on this day.',
    'Naplemente: kb. {0}; óránként innen, éjfélig.': 'Sunset: approx. {0}; hourly from then until midnight.',

    'Időpont': 'Time',
    'Égtáj': 'Direction',
    'Azimut': 'Azimuth',
    'Magasság': 'Altitude',
    'Elhelyezkedés': 'Position',
    'Holdfázis': 'Moon phase',
    'Változás': 'Trend',
    'Időjárás': 'Weather',

    'növekvő': 'waxing',
    'fogyó': 'waning',

    'újhold körül': 'around new moon',
    'növekvő holdsarló': 'waxing crescent',
    'első negyed körül': 'around first quarter',
    'növekvő domború hold': 'waxing gibbous',
    'telihold körül': 'around full moon',
    'fogyó domború hold': 'waning gibbous',
    'utolsó negyed körül': 'around last quarter',
    'fogyó holdsarló': 'waning crescent',

    'észak': 'north',
    'északkelet': 'northeast',
    'kelet': 'east',
    'délkelet': 'southeast',
    'dél': 'south',
    'délnyugat': 'southwest',
    'nyugat': 'west',
    'északnyugat': 'northwest',

    'a horizont alatt': 'below the horizon',
    'a horizonton': 'on the horizon',
    'alacsonyan': 'low',
    'közepesen magasan': 'moderately high',
    'magasan': 'high',
    'a zenit közelében': 'near the zenith',

    'csillagos égbolt': 'starry sky',
    'részben felhős': 'partly cloudy',
    'felhős': 'cloudy',
    'ködös': 'foggy',
    'szitálás': 'drizzle',
    'esős': 'rainy',
    'havazás': 'snowy',
    'zivatar': 'thunderstorm',

    'Az időjárás-előrejelzés nem érhető el ({0}), ezért az Időjárás oszlop kimarad.':
        'The weather forecast is unavailable ({0}), so the Weather column is left out.',

    'A FORECAST_DAYS értéke 1 és {0} közötti egész szám legyen.': 'FORECAST_DAYS must be an integer between 1 and {0}.',
};

export const CATALOGS: Readonly<Record<Locale, Catalog>> = {
    [Locale.Hungarian]: {},
    [Locale.English]: english,
};
