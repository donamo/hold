# Hold – Hold-pozíció kalkulátor

[English](README.md) | **Magyar**

Kisméretű TypeScript-projekt, amely földrajzi koordináták és időpont alapján kiszámítja a Hold közelítő égi helyzetét és távolságát. Node.js alatt parancssorból futtatható, vagy más programba importálható. A számítás helyben történik, külső szolgáltatás és API-kulcs nélkül.

## Telepítés és futtatás

Node.js 24 LTS és npm használata javasolt; az ellenőrzés Node.js 24 alatt történt.

```bash
npm ci
npm run build
npm start
```

A parancssori program Budapest koordinátáival (`47.5`, `19.0`) és az aktuális időponttal számol. Parancssori paramétereket jelenleg nem fogad; egyedi helyhez és időponthoz használd az alábbi API-t.

A kimenet a **Jelenleg** címkével kezdődik. Az aktuális helyzet négy sora: `Azimuth`, `Altitude`, `Distance`, `Parallax`. A szögek fokban, a távolság kilométerben jelenik meg. Az azimut mellett magyar égtáj, a magasság mellett szöveges leírás is szerepel, például:

```text
Azimuth: 315.00° (északnyugat)
Altitude: 25.00° (közepesen magasan)
```

Az égtáj a legközelebbi nyolc fő- és mellékégtáj egyike (0° észak, 90° kelet, 180° dél, 270° nyugat). A magasság leírása: 0° alatt „a horizont alatt”, 0°-nál „a horizonton”, 0–10° között „alacsonyan”, 10–45° között „közepesen magasan”, 45–80° között „magasan”, 80°-tól „a zenit közelében”. A 10°, 45° és 80° már a következő kategóriába tartozik.

## Esti előrejelzés

Az aktuális adatok alatt alapértelmezetten **7 napi táblázat** jelenik meg: a mai nap és a következő 6 nap. Minden táblázat az adott nap naplementéjétől indul, egyórás lépésekben éjfélig. Például 18:56-os naplementénél a sorok 18:56, 19:56, …, 23:56 időpontokra készülnek. Az oszlopok: időpont, magyar égtáj, azimut fokban, magasság fokban, a magasság szöveges leírása, megvilágítottság, holdfázis és növekvő/fogyó jelzés. A horizont alatti sorok is megjelennek.

A napok száma a `FORECAST_DAYS` környezeti változóval állítható (1–365 közötti egész szám):

```bash
FORECAST_DAYS=3 npm start   # Ma és a következő két nap
FORECAST_DAYS=1 npm start  # Csak ma
npm start                 # Beállítatlan változó esetén 7 nap
```

Hibás vagy üres értéknél a program magyar hibaüzenettel, 1-es kilépési kóddal áll le. `.env` fájlt nem tölt be automatikusan; a változót a futtatási környezetben add meg.

A „mai nap” és minden megjelenített időpont az `Europe/Budapest` időzónát követi, a nyári időszámítással együtt, a gép időzónájától függetlenül. Este futtatva is az egész esti táblázat látható.

A naplemente helyben számított becslés a [NOAA egyszerűsített naphelyzet-képletei](https://gml.noaa.gov/grad/solcalc/solareqns.PDF) alapján, 90,833°-os zenitszöggel. A helyi domborzat és a tényleges légköri viszonyok eltérést okozhatnak. A Hold táblázatos pozícióira ugyanazok a pontossági korlátok vonatkoznak, mint az aktuális adatokra.

## Használat programból

Fordítás után a projekt gyökerében létrehozott `.mjs` fájlból:

```js
import { calculateMoonPosition, formatMoonPosition } from './dist/moon.js';

const position = calculateMoonPosition(
  { latitude: 47.5, longitude: 19.0 },
  new Date('2026-09-10T00:00:00Z'),
);

console.log(formatMoonPosition(position));
```

TypeScriptben a `Coordinates` és `MoonPosition` típusok ugyanebből a modulból importálhatók az `import type` szintaxissal. A modul importálása önmagában nem végez számítást és nem ír a konzolra.

### `calculateMoonPosition(coordinates, date)`

A szélesség (`latitude`) −90 és 90, a hosszúság (`longitude`) −180 és 180 közötti véges szám, fokban. A pozitív hosszúság keleti irányt jelöl. Az időpont érvényes JavaScript `Date`; egyértelmű időmegadáshoz használj időzónát, például UTC-t jelölő `Z` végződést. Hibás koordináta vagy érvénytelen dátum esetén a függvény `RangeError` hibát dob.

| Visszatérési mező | Jelentés | Mértékegység |
| --- | --- | --- |
| `azimuth` | Vízszintes irányszög, 0 ≤ érték < 360 | fok |
| `altitude` | Horizonthoz viszonyított magasság; negatív értéknél a horizont alatt | fok |
| `distance` | A számítás szerinti Föld–Hold távolság | km |
| `parallax` | Külön kiszámított parallaxisérték | radián |

### `formatMoonPosition(position)`

Négysoros szöveget készít. Az irányszöget, magasságot és távolságot két, a fokra átváltott parallaxist négy tizedesjeggyel írja ki.

## Felépítés

```text
src/
  moon.ts         Publikus belépési pont (az API újraexportálása)
  position.ts     A Hold pozíciójának számítása
  phase.ts        Megvilágítottság és holdfázis számítása
  evening.ts      Naplemente becslése és az esti előrejelzés adatai
  validation.ts   Koordináták és dátum bemenetellenőrzése
  angle.ts        Szögnormalizálás [0, 360) tartományra
  types.ts        Koordináták és eredmények típusai
  cli.ts          Parancssori belépési pont, budapesti alapértékekkel
  presentation/   Megjelenítési réteg: magyar címkék és szöveges kimenet
    position.ts   Égtáj, magasságleírás, pozíció szövege
    phase.ts      Holdfázis szövege
    evening.ts    Az esti előrejelzés táblázatai
tests/
  moon.test.ts     A számítás és formázás tesztjei
  evening.test.ts  Az esti előrejelzés adatainak és táblázatainak tesztjei
  phase.test.ts    A megvilágítottság és holdfázis tesztjei
```

A `dist/` a fordítás kimenete. A generált JavaScript-fájlok nem tartoznak a források közé.

## Megvilágítottság és holdfázis

A „Jelenleg” blokk és minden óránkénti táblázatsor mutatja a Holdkorong megvilágított részét százalékban, egy tizedesjeggyel, a magyar fázisnevet és a növekvő/fogyó jelzést. Ez nem azonos a tényleges láthatósággal: a Hold lehet a horizont alatt vagy felhők mögött.

A fázis külön, a [Meeus 48.4 közelítés](https://www.celestialprogramming.com/meeus-illuminated_fraction_of_the_moon.html) alapján számolódik. Legfeljebb 1%-nál „újhold körül”, legalább 99%-nál „telihold körül”, 49–51% között „első negyed körül” vagy „utolsó negyed körül” jelenik meg. A többi állapot növekvő/fogyó holdsarló vagy domború hold. Ezek megjelenítési kategóriák, nem a fázisváltás pontos időpontjai.

Az API-ból a `calculateMoonPhase(date)` függvény `{ illumination, phase, trend }` objektumot ad vissza; az `illumination` 0–100 közötti százalék. A `formatMoonPhase(result)` formázott szöveget ad. Mindkettő a `dist/moon.js` modulból exportált, a meglévő pozíció-API változatlan.

A fázistesztek négy [2024-es referenciaeseménynél](https://www.astropixels.com/almanac/almanac21/almanac2024gmt.html) ellenőrzik a megvilágítottságot egy százalékpontos toleranciával. Ez nem jelent minden dátumra érvényes pontossági garanciát.

## Fejlesztés

```bash
npm run typecheck  # A forrás és a tesztek típusellenőrzése
npm test           # Tesztek egyszeri futtatása
npm run build      # JavaScript és típusdeklarációk előállítása
```

Forrásmódosítás után az `npm start` előtt újra fordíts.

## Pontosság és korlátok

A projekt az eredeti prototípus egyszerűsített csillagászati képleteit használja. A refaktorálás ezek tudományos helyességét nem hitelesíti. Az azimut korábbi 180°-os eltolását javítottuk az északtól mért irányhoz. A számítások pontossága referenciaadatokkal még ellenőrzendő; a kimenet ne szolgáljon precíz távcsővezérlés alapjául.

A parallaxis külön eredmény, nincs alkalmazva a visszaadott irányszögre és magasságra. A modell nem veszi figyelembe a légköri fénytörést, a megfigyelő tengerszint feletti magasságát vagy a tereptárgyak takarását. Holdkeltét és holdnyugtát nem számol.

A tesztek a bemenetellenőrzést, az eredmények tartományát, a formázást és a korábbi számítási eredmény megőrzését vizsgálják; független csillagászati referenciaadatokkal nem vetik össze az eredményt.
