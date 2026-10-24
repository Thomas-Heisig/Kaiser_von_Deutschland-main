# Atlas presentation

The game uses one viewport-bound workspace, with three zoom levels:

- Desk: slider 0–11; returns to the map at 18 (hysteresis).
- Central Europe: colored terrain, rivers and documented regional place labels.
- Settlement: the existing playable districts, beginning at slider 40; returns to the map below 35.

`EraPresentation.ts` supplies the shared menu/desk palette and terminology for
medieval, early modern (1500), industrial (1800), modern (1945), and digital
(2000) periods. These are presentation bands, independent of historical polity
records and game rules. The theme updates after loading and advancing time.
Presentation labels use `data-presentation-*`; `data-era-year` remains state
metadata and must never be used as a text replacement target.

The main game and menu fit the viewport. Long management and settings content
uses Previous/Next controls in fixed windows. The Auftrag window contains the
tutorial, population, happiness, stability, advice, campaign goals and news.
On phones, the navigation dropdown exposes all 18 game areas.

## Cartographic assets and license

`public/maps/landscape-central-europe.webp` combines Natural Earth II 1:50m
colored relief with Natural Earth 1:10m rivers and lake centerlines. Both are
public domain, according to Natural Earth:

- https://www.naturalearthdata.com/downloads/50m-raster-data/50m-natural-earth-2/
- https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/
- https://www.naturalearthdata.com/about/terms-of-use/

Bounds: 3°–19° E, 45°–56° N; equirectangular WGS84; output 1920×1320.
The image contains 69 intersecting river segments. These are generalized
modern physical geography, **not reconstructed historical river courses**.
Regional labels remain subject to the existing historical evidence filter.
The map does not draw political borders or assert historical territorial extent.
Source URLs, bounds and river names are recorded in `landscape-source.json`.

## Rebuilding the image

No Python, Plotly or map service is required at runtime. The committed WebP is
loaded by PixiJS and is included in the offline asset manifest.

1. Download and extract `NE2_50M_SR_W.zip` from
   https://naciscdn.org/naturalearth/50m/raster/NE2_50M_SR_W.zip.
2. Download the river GeoJSON from
   https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson.
3. Install the optional local asset builder: `npm install --prefix .browser-tools --no-save --no-package-lock sharp@0.34.5`.
4. Run `node scripts/build-landscape.mjs path/to/NE2_50M_SR_W.tif path/to/rivers.geojson` from the repository root.

Normal builds do not need these source downloads or sharp. The previous relief
asset and Python builder remain available for comparison, but the playable
map now loads the colored landscape asset.
