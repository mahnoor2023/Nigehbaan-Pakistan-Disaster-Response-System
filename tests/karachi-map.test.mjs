import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validateKarachiBoundaryGeometry } from "../src/lib/boundaryGeometry.ts";
import { MALIR_DISTRICT_ID } from "../src/lib/districtSelection.ts";
import { karachiDistricts } from "../src/lib/geography.ts";
import { karachiDistrictGeographicDatasets } from "../src/lib/geographicSources.ts";
import {
  DEFAULT_KARACHI_MAP_LAYERS, KARACHI_CITY_REFERENCE, hasVerifiedKarachiBoundary,
  karachiMapAvailability, karachiMapView, validMalirMapPoints,
} from "../src/lib/karachiMap.ts";
import { advanceTileAvailability, initialTileAvailability } from "../src/lib/mapTiles.ts";

const load = (name) => JSON.parse(readFileSync(new URL(`../public/data/${name}.json`, import.meta.url), "utf8"));

test("all seven districts remain selectable but none claims verified polygon geometry", () => {
  assert.equal(karachiDistricts.length, 7);
  assert.equal(karachiDistrictGeographicDatasets.length, 7);
  for (const district of karachiDistricts) {
    assert.equal(karachiMapAvailability(district.id).districtKnown, true);
    assert.equal(hasVerifiedKarachiBoundary(district.id), false);
    assert.equal(karachiMapAvailability(district.id).boundaryAvailable, false);
  }
  assert.equal(karachiMapAvailability("not-a-district").districtKnown, false);
  assert.equal(DEFAULT_KARACHI_MAP_LAYERS.boundaries, false);
});

test("city overview anchor is a sourced CC0 point, never a district polygon", () => {
  assert.equal(KARACHI_CITY_REFERENCE.id, "wikidata:Q8660:P625");
  assert.equal(KARACHI_CITY_REFERENCE.crs, "EPSG:4326");
  assert.equal(KARACHI_CITY_REFERENCE.geometryType, "Point");
  assert.equal(KARACHI_CITY_REFERENCE.license, "CC0-1.0");
  assert.equal(KARACHI_CITY_REFERENCE.purpose, "city_overview_anchor_only");
  assert.deepEqual(karachiMapView("", []), { mode: "city", center: [24.86, 67.01], zoom: 10 });
});

test("only Malir source-sample coordinates drive district detail; switching clears map points", () => {
  const households = load("households");
  const shelters = load("shelters");
  const malir = validMalirMapPoints(households);
  assert.equal(malir.length, households.filter((item) => item.area === "malir" && item.lat != null && item.lon != null).length);
  assert.equal(malir[0].lat, households[0].lat);
  assert.equal(malir[0].lon, households[0].lon);
  assert.ok(validMalirMapPoints(shelters).length > 0);
  assert.equal(validMalirMapPoints([{ area: "demo-west", lat: 24.9, lon: 67.1 }]).length, 0);
  assert.equal(validMalirMapPoints([{ area: "malir", lat: null, lon: null }]).length, 0);
  const detail = karachiMapView(MALIR_DISTRICT_ID, malir);
  assert.equal(detail.mode, "malir");
  for (const district of karachiDistricts.filter((item) => item.id !== MALIR_DISTRICT_ID)) {
    assert.equal(karachiMapView(district.id, malir).mode, "city");
    assert.equal(karachiMapAvailability(district.id).malirPointsAvailable, false);
  }
  assert.equal(karachiMapView(MALIR_DISTRICT_ID, []).mode, "city");
  assert.equal(karachiMapView(MALIR_DISTRICT_ID, [{ lat: Number.NaN, lon: 67.1 }]).mode, "city");
});

test("candidate polygon screening rejects malformed geometry, CRS and self-intersections", () => {
  const ring = [[66.9, 24.8], [67.1, 24.8], [67.1, 25.0], [66.9, 25.0], [66.9, 24.8]];
  const fixture = { type: "Polygon", coordinates: [ring] };
  assert.deepEqual(validateKarachiBoundaryGeometry(fixture, "EPSG:4326"), []);
  assert.match(validateKarachiBoundaryGeometry(fixture, "EPSG:3857").join(" "), /CRS/);
  assert.match(validateKarachiBoundaryGeometry({ type: "Point", coordinates: [67, 25] }, "EPSG:4326").join(" "), /Polygon/);
  assert.match(validateKarachiBoundaryGeometry({ type: "Polygon", coordinates: [ring.slice(0, -1)] }, "EPSG:4326").join(" "), /not closed/);
  assert.match(validateKarachiBoundaryGeometry({ type: "Polygon", coordinates: [[[66.9, 24.8], [67.1, 25], [67.1, 24.8], [66.9, 25], [66.9, 24.8]]] }, "EPSG:4326").join(" "), /self-intersects/);
  assert.match(validateKarachiBoundaryGeometry({ type: "Polygon", coordinates: [[[80, 24.8], [80.1, 24.8], [80.1, 25], [80, 24.8]]] }, "EPSG:4326").join(" "), /implausible/);
});

test("map fallback and accessible layer controls have explicit non-map alternatives", () => {
  assert.equal(advanceTileAvailability(initialTileAvailability, "timeout").status, "unavailable");
  const controls = readFileSync(new URL("../src/components/KarachiOverview.tsx", import.meta.url), "utf8");
  const map = readFileSync(new URL("../src/components/KarachiOverviewMap.tsx", import.meta.url), "utf8");
  assert.match(controls, /<fieldset/);
  assert.match(controls, /aria-label="District boundaries unavailable"/);
  assert.match(controls, /aria-label="Simulated Malir scenario markers"/);
  assert.match(controls, /aria-label="Malir sourced facility candidates"/);
  assert.match(controls, /id="karachi-map-alternative"/);
  assert.match(map, /role="status"/);
  assert.match(map, /map\.remove\(\)/);
  assert.match(map, /zoomAnimation: false/);
  assert.match(map, /map\.stop\(\)/);
  assert.match(controls, /key=\{districtId\}/);
});
