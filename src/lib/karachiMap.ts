import { karachiDistricts } from "./geography.ts";
import { MALIR_DISTRICT_ID } from "./districtSelection.ts";
import { karachiDistrictGeographicDatasets } from "./geographicSources.ts";
import { hasValidGeographicCoordinates } from "./geo.ts";
import { validateKarachiBoundaryGeometry, type PolygonGeometry } from "./boundaryGeometry.ts";

/** A city reference point, never a district centroid, boundary or response location. */
export const KARACHI_CITY_REFERENCE = {
  id: "wikidata:Q8660:P625",
  name: "Karachi",
  lat: 24.86,
  lon: 67.01,
  crs: "EPSG:4326",
  geometryType: "Point",
  sourceUrl: "https://www.wikidata.org/wiki/Q8660",
  licenseUrl: "https://www.wikidata.org/wiki/Wikidata:Licensing",
  license: "CC0-1.0",
  publisher: "Wikidata contributors",
  retrievedAt: "2026-10-18",
  sourceCoordinate: `24°51'36\"N, 67°0'36\"E`,
  purpose: "city_overview_anchor_only",
} as const;

export type KarachiMapLayers = {
  boundaries: boolean;
  sourcedFeatures: boolean;
  simulation: boolean;
  shelterCandidates: boolean;
};

export const DEFAULT_KARACHI_MAP_LAYERS: KarachiMapLayers = {
  boundaries: false,
  sourcedFeatures: true,
  simulation: false,
  shelterCandidates: true,
};

export type VerifiedKarachiBoundary = {
  districtId: string;
  sourceId: string;
  sourceFeatureId: string;
  crs: "EPSG:4326";
  geometry: PolygonGeometry;
};

/** No candidate has passed source, license, currentness and geometry gates. */
export const verifiedKarachiBoundaries: readonly VerifiedKarachiBoundary[] = [];

export function hasVerifiedKarachiBoundary(districtId: string): boolean {
  const manifest = karachiDistrictGeographicDatasets.find((dataset) => dataset.districtId === districtId);
  return Boolean(manifest && manifest.boundary.status === "verified" && manifest.coverageState === "boundary_verified"
    && verifiedKarachiBoundaries.some((item) => item.districtId === districtId
      && item.sourceId === manifest.boundary.sourceId && item.sourceFeatureId === manifest.boundary.sourceFeatureId
      && validateKarachiBoundaryGeometry(item.geometry, item.crs).length === 0));
}

export function karachiMapAvailability(districtId: string) {
  const districtKnown = karachiDistricts.some((district) => district.id === districtId);
  return {
    districtKnown,
    boundaryAvailable: districtKnown && hasVerifiedKarachiBoundary(districtId),
    malirPointsAvailable: districtId === MALIR_DISTRICT_ID,
  };
}

export function validMalirMapPoints<T extends { area: string; lat: number | null; lon: number | null }>(
  items: readonly T[],
): T[] {
  return items.filter((item) => item.area === "malir" && hasValidGeographicCoordinates(item));
}

/** Select a geographic view without treating synthetic district grids as coordinates. */
export function karachiMapView(districtId: string, malirPoints: readonly { lat: number | null; lon: number | null }[]) {
  const validPoints = malirPoints.filter((point): point is { lat: number; lon: number } => hasValidGeographicCoordinates(point));
  if (districtId !== MALIR_DISTRICT_ID || validPoints.length === 0) {
    return { mode: "city" as const, center: [KARACHI_CITY_REFERENCE.lat, KARACHI_CITY_REFERENCE.lon] as [number, number], zoom: 10 };
  }
  const latitudes = validPoints.map((point) => point.lat);
  const longitudes = validPoints.map((point) => point.lon);
  return {
    mode: "malir" as const,
    bounds: [[Math.min(...latitudes), Math.min(...longitudes)], [Math.max(...latitudes), Math.max(...longitudes)]] as [[number, number], [number, number]],
  };
}
