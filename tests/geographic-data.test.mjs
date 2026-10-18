import assert from "node:assert/strict";
import test from "node:test";

import {
  GEOGRAPHIC_DATA_SCHEMA_VERSION,
  validateGeographicSourceCatalog,
  validateKarachiDistrictDatasetCatalog,
  validateDistrictGeographicDataset,
  validateDistrictAdministrativeReference,
  validateGeographicSourceManifest,
  validateSourcedGeographicFeature,
  validateSyntheticScenarioManifest,
} from "../src/lib/geographicData.ts";
import { geographicSources, karachiDistrictAdministrativeReferences, karachiDistrictGeographicDatasets } from "../src/lib/geographicSources.ts";
import { karachiDistricts } from "../src/lib/geography.ts";

test("candidate source manifests include provenance, licenses, and retrieval timestamps", () => {
  assert.equal(geographicSources.length, 5);
  assert.deepEqual(validateGeographicSourceCatalog(geographicSources), []);
  for (const source of geographicSources) assert.deepEqual(validateGeographicSourceManifest(source), []);
  assert.equal(new Set(geographicSources.map((source) => source.id)).size, geographicSources.length);
  assert.equal(geographicSources.find((source) => source.id.startsWith("osm-overpass"))?.retrieval.query?.includes("out count"), true);
});

test("Keamari has an attributable OSM administrative reference without a boundary or map claim", () => {
  assert.equal(karachiDistrictAdministrativeReferences.length, 1);
  const reference = karachiDistrictAdministrativeReferences[0];
  assert.deepEqual(validateDistrictAdministrativeReference(reference, geographicSources), []);
  assert.equal(reference.districtId, "pk-sindh-karachi-keamari");
  assert.equal(reference.sourceFeatureId, "relation:16351022");
  assert.equal(reference.boundaryGeometryVerified, false);
  assert.equal(reference.displayOnOperationalMap, false);
  assert.equal(reference.purpose, "directory_label_only");
});

test("all seven Karachi districts have candidate-only manifests with no claimed geometry", () => {
  assert.equal(karachiDistrictGeographicDatasets.length, 7);
  assert.deepEqual(validateKarachiDistrictDatasetCatalog(karachiDistrictGeographicDatasets, geographicSources), []);
  assert.deepEqual(
    karachiDistrictGeographicDatasets.map((dataset) => dataset.districtId),
    karachiDistricts.map((district) => district.id),
  );
  for (const dataset of karachiDistrictGeographicDatasets) {
    assert.deepEqual(validateDistrictGeographicDataset(dataset, geographicSources), []);
    assert.equal(dataset.coverageState, "boundary_candidate");
    assert.equal(dataset.boundary.status, "candidate_unverified");
    assert.equal(dataset.boundary.geometryType, null);
    assert.equal(dataset.boundary.sourceFeatureId, null);
  }
});

test("catalog validation detects duplicate sources and missing district manifests", () => {
  assert.match(validateGeographicSourceCatalog([...geographicSources, geographicSources[0]]).join("\n"), /Duplicate geographic source ID/);
  assert.match(validateKarachiDistrictDatasetCatalog(karachiDistrictGeographicDatasets.slice(1), geographicSources).join("\n"), /Missing Karachi district dataset/);
});

test("dataset validation rejects unknown districts, sources, and premature coverage claims", () => {
  const base = karachiDistrictGeographicDatasets[0];
  assert.ok(base);
  const invalid = {
    ...base,
    districtId: "pk-sindh-karachi-invented",
    sourceIds: ["missing-source"],
    coverageState: "boundary_verified",
  };
  const errors = validateDistrictGeographicDataset(invalid, geographicSources).join("\n");
  assert.match(errors, /Unknown Karachi district ID/);
  assert.match(errors, /unknown source/);
  assert.match(errors, /without a verified boundary/);
});

test("verified boundaries require polygon geometry, source-native IDs, and cleared reuse", () => {
  const base = karachiDistrictGeographicDatasets[0];
  assert.ok(base);
  const invalid = {
    ...base,
    coverageState: "boundary_verified",
    boundary: { ...base.boundary, status: "verified", verifiedAt: "not-a-time" },
  };
  const errors = validateDistrictGeographicDataset(invalid, geographicSources).join("\n");
  assert.match(errors, /source feature ID/);
  assert.match(errors, /missing Polygon or MultiPolygon/);
  assert.match(errors, /invalid verification timestamp/);
  assert.match(errors, /not cleared for redistribution/);
});

test("sourced geography cannot assert facility operations or use invalid geometry types", () => {
  const feature = {
    kind: "sourced_geographic_feature",
    id: "osm:node:1",
    featureKind: "emergency_facility",
    districtId: "pk-sindh-karachi-central",
    sourceId: "osm-overpass-2026-10-18",
    sourceFeatureId: "node/1",
    geometry: { type: "LineString", coordinates: [[67, 25], [67.1, 25.1]] },
    properties: {},
    operationalStatus: "available",
  };
  const errors = validateSourcedGeographicFeature(feature, geographicSources).join("\n");
  assert.match(errors, /cannot use LineString geometry/);
  assert.match(errors, /cannot assert operational availability/);
});

test("synthetic scenario manifests are separate and must disclose their assumptions", () => {
  const valid = {
    schemaVersion: GEOGRAPHIC_DATA_SCHEMA_VERSION,
    kind: "synthetic_response_scenario",
    scenarioId: "scenario:pk-sindh-karachi-central:flood-v1",
    version: "1.0.0",
    districtId: "pk-sindh-karachi-central",
    generatedAt: "2026-10-18T05:00:00Z",
    geographyDatasetId: null,
    synthetic: true,
    containsRealPeople: false,
    assumptions: ["Demonstration entities are synthetic and do not represent residents."],
  };
  assert.deepEqual(validateSyntheticScenarioManifest(valid), []);
  const invalid = { ...valid, districtId: "malir", assumptions: [] };
  const errors = validateSyntheticScenarioManifest(invalid).join("\n");
  assert.match(errors, /Unknown Karachi district ID/);
  assert.match(errors, /must disclose its assumptions/);
});
