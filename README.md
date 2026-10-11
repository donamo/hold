# Hold – Moon Position Calculator

**English** | [Magyar](README.hu.md)

A small TypeScript project that calculates the approximate sky position and distance of the Moon for a geographic location and time. It runs from the command line under Node.js or can be imported into another program. All calculations are done locally, with no external service or API key.

> "Hold" is Hungarian for "Moon". The command-line output and the descriptive labels are in Hungarian; English translations are given below.

## Installation and usage

Node.js 24 LTS and npm are recommended; the project has been verified on Node.js 24.

```bash
npm ci
npm run build
npm start
```

The command-line program uses the coordinates of Budapest (`47.5`, `19.0`) and the current time. It does not accept command-line arguments yet; use the API below for a custom location and time.

The output starts with the **Jelenleg** ("Currently") label. The current position is printed in four lines: `Azimuth`, `Altitude`, `Distance`, `Parallax`. Angles are shown in degrees, distance in kilometres. The azimuth is followed by a Hungarian compass direction and the altitude by a descriptive label, for example:

```text
Azimuth: 315.00° (északnyugat)
Altitude: 25.00° (közepesen magasan)
```

The compass direction is the nearest of the eight principal and intercardinal directions (0° north, 90° east, 180° south, 270° west):

| Label | Meaning |
| --- | --- |
| `észak` / `északkelet` / `kelet` / `délkelet` | north / northeast / east / southeast |
| `dél` / `délnyugat` / `nyugat` / `északnyugat` | south / southwest / west / northwest |

Altitude labels:

| Altitude | Label | Meaning |
| --- | --- | --- |
| below 0° | `a horizont alatt` | below the horizon |
| exactly 0° | `a horizonton` | on the horizon |
| 0–10° | `alacsonyan` | low |
| 10–45° | `közepesen magasan` | moderately high |
| 45–80° | `magasan` | high |
| 80° and above | `a zenit közelében` | near the zenith |

The boundary values 10°, 45° and 80° belong to the higher category.

## Evening forecast

Below the current data, **7 daily tables** are shown by default: today and the following 6 days. Each table starts at that day's sunset and continues in one-hour steps until midnight. For example, with a sunset at 18:56 the rows are 18:56, 19:56, …, 23:56. The columns are: time, Hungarian compass direction, azimuth in degrees, altitude in degrees, altitude label, illumination, moon phase, and waxing/waning indicator. Rows below the horizon are included.

The number of days can be set with the `FORECAST_DAYS` environment variable (an integer from 1 to 365):

```bash
FORECAST_DAYS=3 npm start  # Today and the next two days
FORECAST_DAYS=1 npm start  # Today only
npm start                  # 7 days when the variable is not set
```

For an invalid or empty value the program exits with a Hungarian error message and exit code 1. It does not load `.env` files automatically; set the variable in the runtime environment.

"Today" and all displayed times follow the `Europe/Budapest` time zone, including daylight saving time, regardless of the machine's time zone. When run in the evening, the whole evening table is still shown.

Sunset is a local estimate based on the [NOAA simplified solar position equations](https://gml.noaa.gov/grad/solcalc/solareqns.PDF), using a zenith angle of 90.833°. Local terrain and actual atmospheric conditions may cause deviations. The tabulated Moon positions are subject to the same accuracy limits as the current data.

## Programmatic usage

After building, from an `.mjs` file in the project root:

```js
import { calculateMoonPosition, formatMoonPosition } from './dist/moon.js';

const position = calculateMoonPosition(
  { latitude: 47.5, longitude: 19.0 },
  new Date('2026-09-10T00:00:00Z'),
);

console.log(formatMoonPosition(position));
```

In TypeScript, the `Coordinates` and `MoonPosition` types can be imported from the same module with `import type`. Importing the module does not perform any calculation or write to the console.

### `calculateMoonPosition(coordinates, date)`

`latitude` must be a finite number between −90 and 90 and `longitude` between −180 and 180, in degrees. Positive longitude means east. The time must be a valid JavaScript `Date`; to avoid ambiguity, include a time zone, such as the `Z` suffix for UTC. The function throws a `RangeError` for invalid coordinates or an invalid date.

| Return field | Meaning | Unit |
| --- | --- | --- |
| `azimuth` | Horizontal direction, 0 ≤ value < 360 | degrees |
| `altitude` | Height above the horizon; negative values are below the horizon | degrees |
| `distance` | Calculated Earth–Moon distance | km |
| `parallax` | Separately calculated parallax value | radians |

### `formatMoonPosition(position)`

Returns a four-line string. Azimuth, altitude and distance are printed with two decimal places, and the parallax, converted to degrees, with four.

## Project structure

```text
src/
  moon.ts         Public entry point (re-exports the API)
  position.ts     Moon position calculation
  phase.ts        Illumination and moon phase calculation
  evening.ts      Sunset estimate and evening forecast data
  validation.ts   Input validation for coordinates and dates
  angle.ts        Angle normalization to [0, 360)
  types.ts        Coordinate and result types
  cli.ts          Command-line entry point with Budapest defaults
  presentation/   Display layer: Hungarian labels and text output
    position.ts   Compass direction, altitude label, position text
    phase.ts      Phase text
    evening.ts    Evening forecast tables
tests/
  moon.test.ts     Tests for calculation and formatting
  evening.test.ts  Tests for the evening forecast data and tables
  phase.test.ts    Tests for illumination and moon phase
```

`dist/` is the build output. The generated JavaScript files are not part of the sources.

## Illumination and moon phase

The "Jelenleg" block and every hourly table row show the illuminated fraction of the Moon's disk as a percentage with one decimal place, the Hungarian phase name, and the waxing/waning indicator (`növekvő` / `fogyó`). This is not the same as actual visibility: the Moon may be below the horizon or behind clouds.

The phase is calculated separately, using the [Meeus 48.4 approximation](https://www.celestialprogramming.com/meeus-illuminated_fraction_of_the_moon.html):

| Illumination | Label | Meaning |
| --- | --- | --- |
| at most 1% | `újhold körül` | around new moon |
| at least 99% | `telihold körül` | around full moon |
| 49–51% | `első negyed körül` / `utolsó negyed körül` | around first / last quarter |
| otherwise, below 50% | `növekvő holdsarló` / `fogyó holdsarló` | waxing / waning crescent |
| otherwise, above 50% | `növekvő domború hold` / `fogyó domború hold` | waxing / waning gibbous |

These are display categories, not the exact times of phase changes.

In the API, `calculateMoonPhase(date)` returns an `{ illumination, phase, trend }` object; `illumination` is a percentage from 0 to 100. `formatMoonPhase(result)` returns a formatted string. Both are exported from `dist/moon.js`; the existing position API is unchanged.

The phase tests check the illumination at four [2024 reference events](https://www.astropixels.com/almanac/almanac21/almanac2024gmt.html) with a tolerance of one percentage point. This is not an accuracy guarantee for every date.

## Development

```bash
npm run typecheck  # Type-check sources and tests
npm test           # Run the tests once
npm run build      # Emit JavaScript and type declarations
```

Rebuild after changing the sources before running `npm start`.

## Accuracy and limitations

The project uses the simplified astronomical formulas of the original prototype. The refactoring does not validate their scientific correctness. The previous 180° azimuth offset has been corrected to a north-based direction. The accuracy of the calculations still needs to be verified against reference data; do not use the output for precise telescope control.

Parallax is a separate result and is not applied to the returned azimuth and altitude. The model does not account for atmospheric refraction, the observer's elevation, or obstruction by terrain. It does not calculate moonrise or moonset.

The tests cover input validation, result ranges, formatting, and preservation of earlier calculation results; they do not compare results with independent astronomical reference data.
