import type { DistrictAdministrativeReference, DistrictGeographicDatasetManifest, GeographicSourceManifest } from "./geographicData.ts";
import { GEOGRAPHIC_DATA_SCHEMA_VERSION } from "./geographicData.ts";
import { karachiDistricts } from "./geography.ts";

const RETRIEVED_AT = "2026-10-18T05:00:00Z";

export const geographicSources = [
  {
    schemaVersion: GEOGRAPHIC_DATA_SCHEMA_VERSION,
    id: "osm-nominatim-keamari-2026-10-18",
    name: "Keamari District administrative relation reference",
    publisher: "OpenStreetMap contributors",
    sourceUrl: "https://www.openstreetmap.org/relation/16351022",
    retrievedAt: "2026-10-18T06:35:00Z",
    sourceDate: "2023-11-06T06:50:44Z",
    retrieval: {
      method: "api_metadata",
      endpoint: "https://nominatim.openstreetmap.org/search",
      query: "q=ضلع کیماڑی, Pakistan&format=jsonv2&limit=3&addressdetails=1; relation confirmed with OSM API 0.6",
    },
    license: {
      name: "Open Data Commons Open Database License 1.0",
      identifier: "ODbL-1.0",
      url: "https://opendatacommons.org/licenses/odbl/1-0/",
      redistribution: "permitted_with_conditions",
      attribution: "© OpenStreetMap contributors",
    },
    content: ["administrative_reference"],
    authority: "community",
    limitations: [
      "OSM relation 16351022 identifies Keamari District as an admin_level=6 administrative boundary; it is community-maintained, not an official boundary publication.",
      "The stored Nominatim point is directory-label metadata only. No relation geometry was downloaded or geometry-validated, and the point must not be used as a district polygon or response location.",
    ],
  },
  {
    schemaVersion: GEOGRAPHIC_DATA_SCHEMA_VERSION,
    id: "commissioner-karachi-directory",
    name: "Karachi Division Administrative Area Directory",
    publisher: "Commissioner Karachi",
    sourceUrl: "https://commissionerkarachi.gos.pk/area-map",
    retrievedAt: RETRIEVED_AT,
    sourceDate: null,
    retrieval: { method: "web_page", endpoint: "https://commissionerkarachi.gos.pk/area-map", query: null },
    license: {
      name: "No reusable GIS license published",
      identifier: null,
      url: null,
      redistribution: "requires_review",
      attribution: "Commissioner Karachi",
    },
    content: ["administrative_directory"],
    authority: "authoritative",
    limitations: [
      "The directory verifies seven districts and 31 subdivisions but does not publish downloadable vector geometry.",
      "Its displayed map must not be traced or redistributed without permission.",
    ],
  },
  {
    schemaVersion: GEOGRAPHIC_DATA_SCHEMA_VERSION,
    id: "pbs-census-2023-gis",
    name: "Census 2023 administrative GIS layers",
    publisher: "Pakistan Bureau of Statistics",
    sourceUrl: "https://www.pbs.gov.pk/gis/",
    retrievedAt: RETRIEVED_AT,
    sourceDate: "2023",
    retrieval: { method: "web_page", endpoint: "https://www.pbs.gov.pk/gis/", query: null },
    license: {
      name: "Reuse terms for downloadable boundary geometry not yet verified",
      identifier: null,
      url: "https://www.pbs.gov.pk/data-dissemination/",
      redistribution: "requires_review",
      attribution: "Pakistan Bureau of Statistics",
    },
    content: ["boundary", "road", "waterway"],
    authority: "authoritative",
    limitations: [
      "PBS confirms it maintains district and tehsil layers, but this audit did not locate a directly downloadable Karachi polygon artifact with unambiguous reuse terms.",
      "The Pakistan Spatial Insights map is a visualization and must not be scraped as a substitute for source geometry.",
    ],
  },
  {
    schemaVersion: GEOGRAPHIC_DATA_SCHEMA_VERSION,
    id: "osm-overpass-2026-10-18",
    name: "OpenStreetMap administrative relation reconnaissance",
    publisher: "OpenStreetMap contributors",
    sourceUrl: "https://www.openstreetmap.org/copyright",
    retrievedAt: RETRIEVED_AT,
    sourceDate: "2026-10-18T04:52:21Z",
    retrieval: {
      method: "overpass_query",
      endpoint: "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
      query: "[out:json][timeout:60];rel[boundary=administrative](24.70,66.80,25.60,67.60);out count;",
    },
    license: {
      name: "Open Data Commons Open Database License 1.0",
      identifier: "ODbL-1.0",
      url: "https://opendatacommons.org/licenses/odbl/1-0/",
      redistribution: "permitted_with_conditions",
      attribution: "© OpenStreetMap contributors",
    },
    content: ["boundary", "road", "building", "medical_facility", "emergency_facility", "waterway"],
    authority: "community",
    limitations: [
      "A small Overpass count query found 50 administrative relations in the Karachi reconnaissance extent at the recorded OSM snapshot timestamp.",
      "Relation tags and geometries could not be retrieved reliably during this audit, so no individual district relation or polygon is verified.",
      "OSM features do not establish official boundaries or operational facility availability.",
    ],
  },
  {
    schemaVersion: GEOGRAPHIC_DATA_SCHEMA_VERSION,
    id: "geoboundaries-pak-adm2-2019",
    name: "geoBoundaries Pakistan ADM2",
    publisher: "geoBoundaries",
    sourceUrl: "https://www.geoboundaries.org/api/current/gbOpen/PAK/ADM2/",
    retrievedAt: RETRIEVED_AT,
    sourceDate: "2019",
    retrieval: { method: "api_metadata", endpoint: "https://www.geoboundaries.org/api/current/gbOpen/PAK/ADM2/", query: null },
    license: {
      name: "Public Domain (as declared by the layer metadata)",
      identifier: "Public-Domain",
      url: "https://creativecommons.org/public-domain/",
      redistribution: "permitted_with_conditions",
      attribution: "geoBoundaries",
    },
    content: ["boundary"],
    authority: "third_party",
    limitations: [
      "The API reports 126 ADM2 units represented for 2019 and cites geoBoundaries and Wikipedia as sources.",
      "It predates the current Commissioner Karachi seven-district directory and is not accepted as the Phase 0B.3 Karachi boundary source.",
    ],
  },
] as const satisfies readonly GeographicSourceManifest[];

export const karachiDistrictAdministrativeReferences = [
  {
    kind: "administrative_reference",
    districtId: "pk-sindh-karachi-keamari",
    sourceId: "osm-nominatim-keamari-2026-10-18",
    sourceFeatureId: "relation:16351022",
    sourceFeatureUrl: "https://www.openstreetmap.org/relation/16351022",
    sourceUpdatedAt: "2023-11-06T06:50:44Z",
    retrievedAt: "2026-10-18T06:35:00Z",
    name: "ضلع کیماڑی",
    nameEnglish: "Keamari District",
    adminLevel: "6",
    referencePoint: { lat: 24.7250613, lon: 66.6926662 },
    purpose: "directory_label_only",
    boundaryGeometryVerified: false,
    displayOnOperationalMap: false,
  },
] as const satisfies readonly DistrictAdministrativeReference[];

export function districtAdministrativeReference(districtId: string): DistrictAdministrativeReference | null {
  return karachiDistrictAdministrativeReferences.find((reference) => reference.districtId === districtId) ?? null;
}

const emptyLayers = {
  boundary: "candidate",
  road: "not_acquired",
  building: "not_acquired",
  medical_facility: "not_acquired",
  emergency_facility: "not_acquired",
  waterway: "not_acquired",
} as const;

export const karachiDistrictGeographicDatasets = karachiDistricts.map((district): DistrictGeographicDatasetManifest => ({
  schemaVersion: GEOGRAPHIC_DATA_SCHEMA_VERSION,
  kind: "sourced_geography",
  datasetId: `geography:${district.id}:candidate-v1`,
  version: "0.1.0",
  districtId: district.id,
  coverageState: "boundary_candidate",
  generatedAt: RETRIEVED_AT,
  sourceIds: ["commissioner-karachi-directory", "pbs-census-2023-gis", "osm-overpass-2026-10-18"],
  boundary: {
    status: "candidate_unverified",
    sourceId: "pbs-census-2023-gis",
    sourceFeatureId: null,
    geometryType: null,
    verifiedAt: null,
    accuracy: "unknown",
  },
  layers: emptyLayers,
  limitations: [
    "No reusable district polygon has been acquired or geometry-validated.",
    "This manifest is source metadata only and must not enable a map boundary or response simulation.",
  ],
}));
