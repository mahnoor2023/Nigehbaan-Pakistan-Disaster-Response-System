import { karachiDistricts } from "./geography.ts";

export const GEOGRAPHIC_DATA_SCHEMA_VERSION = "1.0.0" as const;

export const GEOGRAPHIC_DATASET_COVERAGE_STATES = [
  "metadata_only",
  "boundary_candidate",
  "boundary_verified",
  "geography_available",
] as const;
export type GeographicDatasetCoverageState = (typeof GEOGRAPHIC_DATASET_COVERAGE_STATES)[number];

export const GEOGRAPHIC_LAYER_STATES = ["not_acquired", "candidate", "verified"] as const;
export type GeographicLayerState = (typeof GEOGRAPHIC_LAYER_STATES)[number];

export const BOUNDARY_VERIFICATION_STATES = ["not_acquired", "candidate_unverified", "verified"] as const;
export type BoundaryVerificationState = (typeof BOUNDARY_VERIFICATION_STATES)[number];

export const REDISTRIBUTION_STATES = ["permitted_with_conditions", "requires_review", "not_permitted", "unknown"] as const;
export type RedistributionState = (typeof REDISTRIBUTION_STATES)[number];

export const GEOGRAPHIC_FEATURE_KINDS = ["boundary", "road", "building", "medical_facility", "emergency_facility", "waterway"] as const;
export type GeographicFeatureKind = (typeof GEOGRAPHIC_FEATURE_KINDS)[number];

export const GEOGRAPHIC_SOURCE_CONTENT_TYPES = ["administrative_directory", "administrative_reference", ...GEOGRAPHIC_FEATURE_KINDS] as const;
export type GeographicSourceContentType = (typeof GEOGRAPHIC_SOURCE_CONTENT_TYPES)[number];

export const GEOJSON_GEOMETRY_TYPES = ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"] as const;
export type GeoJsonGeometryType = (typeof GEOJSON_GEOMETRY_TYPES)[number];

export type SourceLicense = {
  name: string;
  identifier: string | null;
  url: string | null;
  redistribution: RedistributionState;
  attribution: string | null;
};

export type GeographicSourceManifest = {
  schemaVersion: typeof GEOGRAPHIC_DATA_SCHEMA_VERSION;
  id: string;
  name: string;
  publisher: string;
  sourceUrl: string;
  retrievedAt: string;
  sourceDate: string | null;
  retrieval: {
    method: "web_page" | "api_metadata" | "overpass_query" | "file_download";
    endpoint: string;
    query: string | null;
  };
  license: SourceLicense;
  content: readonly GeographicSourceContentType[];
  authority: "authoritative" | "community" | "third_party";
  limitations: readonly string[];
};

export type DistrictBoundaryDescriptor = {
  status: BoundaryVerificationState;
  sourceId: string | null;
  sourceFeatureId: string | null;
  geometryType: "Polygon" | "MultiPolygon" | null;
  verifiedAt: string | null;
  accuracy: "unknown" | "source_asserted" | "cross_checked";
};

export type DistrictGeographicDatasetManifest = {
  schemaVersion: typeof GEOGRAPHIC_DATA_SCHEMA_VERSION;
  kind: "sourced_geography";
  datasetId: string;
  version: string;
  districtId: string;
  coverageState: GeographicDatasetCoverageState;
  generatedAt: string;
  sourceIds: readonly string[];
  boundary: DistrictBoundaryDescriptor;
  layers: Readonly<Record<GeographicFeatureKind, GeographicLayerState>>;
  limitations: readonly string[];
};

export type SyntheticScenarioManifest = {
  schemaVersion: typeof GEOGRAPHIC_DATA_SCHEMA_VERSION;
  kind: "synthetic_response_scenario";
  scenarioId: string;
  version: string;
  districtId: string;
  generatedAt: string;
  geographyDatasetId: string | null;
  synthetic: true;
  containsRealPeople: false;
  assumptions: readonly string[];
};

export type GeoJsonGeometry = {
  type: GeoJsonGeometryType;
  coordinates: unknown;
};

export type SourcedGeographicFeature = {
  kind: "sourced_geographic_feature";
  id: string;
  featureKind: GeographicFeatureKind;
  districtId: string;
  sourceId: string;
  sourceFeatureId: string;
  geometry: GeoJsonGeometry;
  properties: Readonly<Record<string, string | number | boolean | null>>;
  operationalStatus: "unknown";
};

export type DistrictAdministrativeReference = {
  kind: "administrative_reference";
  districtId: string;
  sourceId: string;
  sourceFeatureId: string;
  sourceFeatureUrl: string;
  sourceUpdatedAt: string;
  retrievedAt: string;
  name: string;
  nameEnglish: string;
  adminLevel: string;
  referencePoint: { lat: number; lon: number };
  purpose: "directory_label_only";
  boundaryGeometryVerified: false;
  displayOnOperationalMap: false;
};

const DISTRICT_IDS = new Set(karachiDistricts.map((district) => district.id));
const ID_PATTERN = /^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/;

function isHttpsUrl(value: string | null): boolean {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isIsoTimestamp(value: string | null): boolean {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && !Number.isNaN(Date.parse(value)));
}

function isSourceDate(value: string | null): boolean {
  if (value === null || /^\d{4}$/.test(value)) return true;
  return /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(value) && !Number.isNaN(Date.parse(value));
}

function validateDistrictId(districtId: string, errors: string[]): void {
  if (!DISTRICT_IDS.has(districtId)) errors.push(`Unknown Karachi district ID: ${districtId}`);
}

export function validateGeographicSourceManifest(source: GeographicSourceManifest): string[] {
  const errors: string[] = [];
  if (source.schemaVersion !== GEOGRAPHIC_DATA_SCHEMA_VERSION) errors.push(`Unsupported source schema version: ${source.schemaVersion}`);
  if (!ID_PATTERN.test(source.id)) errors.push(`Invalid source ID: ${source.id}`);
  if (!source.name.trim() || !source.publisher.trim()) errors.push(`Source ${source.id} must name its source and publisher`);
  if (!isHttpsUrl(source.sourceUrl)) errors.push(`Source ${source.id} must use an HTTPS source URL`);
  if (!isIsoTimestamp(source.retrievedAt)) errors.push(`Source ${source.id} has an invalid retrieval timestamp`);
  if (!isSourceDate(source.sourceDate)) errors.push(`Source ${source.id} has an invalid source date`);
  if (!isHttpsUrl(source.retrieval.endpoint)) errors.push(`Source ${source.id} has an invalid retrieval endpoint`);
  if (source.retrieval.method === "overpass_query" && !source.retrieval.query?.trim()) errors.push(`Overpass source ${source.id} must preserve its query`);
  if (!source.license.name.trim()) errors.push(`Source ${source.id} is missing a license name or review label`);
  if (!REDISTRIBUTION_STATES.includes(source.license.redistribution)) errors.push(`Source ${source.id} has an invalid redistribution state`);
  if (source.license.url !== null && !isHttpsUrl(source.license.url)) errors.push(`Source ${source.id} has an invalid license URL`);
  if (source.license.redistribution === "permitted_with_conditions") {
    if (!source.license.identifier) errors.push(`Reusable source ${source.id} must identify its license`);
    if (!source.license.url) errors.push(`Reusable source ${source.id} must link its license`);
    if (!source.license.attribution?.trim()) errors.push(`Reusable source ${source.id} must define attribution`);
  }
  if (!source.content.length) errors.push(`Source ${source.id} must declare at least one content type`);
  if (source.content.some((kind) => !GEOGRAPHIC_SOURCE_CONTENT_TYPES.includes(kind))) errors.push(`Source ${source.id} declares an invalid content type`);
  return errors;
}

export function validateGeographicSourceCatalog(sources: readonly GeographicSourceManifest[]): string[] {
  const errors = sources.flatMap(validateGeographicSourceManifest);
  const seen = new Set<string>();
  for (const source of sources) {
    if (seen.has(source.id)) errors.push(`Duplicate geographic source ID: ${source.id}`);
    seen.add(source.id);
  }
  return [...new Set(errors)];
}

export function validateDistrictGeographicDataset(
  dataset: DistrictGeographicDatasetManifest,
  sources: readonly GeographicSourceManifest[],
): string[] {
  const errors: string[] = [];
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  if (dataset.schemaVersion !== GEOGRAPHIC_DATA_SCHEMA_VERSION) errors.push(`Unsupported dataset schema version: ${dataset.schemaVersion}`);
  if (dataset.kind !== "sourced_geography") errors.push(`Dataset ${dataset.datasetId} is not sourced geography`);
  if (!ID_PATTERN.test(dataset.datasetId)) errors.push(`Invalid dataset ID: ${dataset.datasetId}`);
  validateDistrictId(dataset.districtId, errors);
  if (!GEOGRAPHIC_DATASET_COVERAGE_STATES.includes(dataset.coverageState)) errors.push(`Invalid coverage state: ${dataset.coverageState}`);
  if (!isIsoTimestamp(dataset.generatedAt)) errors.push(`Dataset ${dataset.datasetId} has an invalid generation timestamp`);
  if (!dataset.sourceIds.length) errors.push(`Dataset ${dataset.datasetId} must reference at least one source`);
  for (const sourceId of dataset.sourceIds) {
    if (!sourceById.has(sourceId)) errors.push(`Dataset ${dataset.datasetId} references unknown source ${sourceId}`);
  }
  if (!BOUNDARY_VERIFICATION_STATES.includes(dataset.boundary.status)) errors.push(`Dataset ${dataset.datasetId} has an invalid boundary status`);
  for (const kind of GEOGRAPHIC_FEATURE_KINDS) {
    if (!GEOGRAPHIC_LAYER_STATES.includes(dataset.layers[kind])) errors.push(`Dataset ${dataset.datasetId} has an invalid ${kind} layer state`);
  }

  const verifiedCoverage = dataset.coverageState === "boundary_verified" || dataset.coverageState === "geography_available";
  if (verifiedCoverage && dataset.boundary.status !== "verified") errors.push(`Dataset ${dataset.datasetId} claims verified coverage without a verified boundary`);
  if (dataset.boundary.status === "verified") {
    if (!dataset.boundary.sourceId || !dataset.sourceIds.includes(dataset.boundary.sourceId)) errors.push(`Dataset ${dataset.datasetId} boundary must reference one of its sources`);
    if (!dataset.boundary.sourceFeatureId) errors.push(`Dataset ${dataset.datasetId} verified boundary is missing a source feature ID`);
    if (!dataset.boundary.geometryType) errors.push(`Dataset ${dataset.datasetId} verified boundary is missing Polygon or MultiPolygon geometry`);
    if (!isIsoTimestamp(dataset.boundary.verifiedAt)) errors.push(`Dataset ${dataset.datasetId} verified boundary has an invalid verification timestamp`);
    const source = dataset.boundary.sourceId ? sourceById.get(dataset.boundary.sourceId) : undefined;
    if (source && source.license.redistribution !== "permitted_with_conditions") errors.push(`Dataset ${dataset.datasetId} boundary source is not cleared for redistribution`);
  } else if (dataset.boundary.geometryType || dataset.boundary.sourceFeatureId || dataset.boundary.verifiedAt) {
    errors.push(`Dataset ${dataset.datasetId} exposes boundary geometry metadata before verification`);
  }
  return errors;
}

export function validateKarachiDistrictDatasetCatalog(
  datasets: readonly DistrictGeographicDatasetManifest[],
  sources: readonly GeographicSourceManifest[],
): string[] {
  const errors = datasets.flatMap((dataset) => validateDistrictGeographicDataset(dataset, sources));
  const datasetIds = new Set<string>();
  const districtIds = new Set<string>();
  for (const dataset of datasets) {
    if (datasetIds.has(dataset.datasetId)) errors.push(`Duplicate geographic dataset ID: ${dataset.datasetId}`);
    if (districtIds.has(dataset.districtId)) errors.push(`Duplicate Karachi district dataset: ${dataset.districtId}`);
    datasetIds.add(dataset.datasetId);
    districtIds.add(dataset.districtId);
  }
  for (const districtId of DISTRICT_IDS) {
    if (!districtIds.has(districtId)) errors.push(`Missing Karachi district dataset: ${districtId}`);
  }
  return [...new Set(errors)];
}

export function validateSyntheticScenarioManifest(scenario: SyntheticScenarioManifest): string[] {
  const errors: string[] = [];
  if (scenario.schemaVersion !== GEOGRAPHIC_DATA_SCHEMA_VERSION) errors.push(`Unsupported scenario schema version: ${scenario.schemaVersion}`);
  if (scenario.kind !== "synthetic_response_scenario" || scenario.synthetic !== true || scenario.containsRealPeople !== false) {
    errors.push(`Scenario ${scenario.scenarioId} must be explicitly synthetic and contain no real people`);
  }
  if (!ID_PATTERN.test(scenario.scenarioId)) errors.push(`Invalid scenario ID: ${scenario.scenarioId}`);
  validateDistrictId(scenario.districtId, errors);
  if (!isIsoTimestamp(scenario.generatedAt)) errors.push(`Scenario ${scenario.scenarioId} has an invalid generation timestamp`);
  if (!scenario.assumptions.length) errors.push(`Scenario ${scenario.scenarioId} must disclose its assumptions`);
  return errors;
}

const ALLOWED_GEOMETRY: Record<GeographicFeatureKind, readonly GeoJsonGeometryType[]> = {
  boundary: ["Polygon", "MultiPolygon"],
  road: ["LineString", "MultiLineString"],
  building: ["Polygon", "MultiPolygon"],
  medical_facility: ["Point", "Polygon", "MultiPolygon"],
  emergency_facility: ["Point", "Polygon", "MultiPolygon"],
  waterway: ["LineString", "MultiLineString", "Polygon", "MultiPolygon"],
};

export function validateSourcedGeographicFeature(
  feature: SourcedGeographicFeature,
  sources: readonly GeographicSourceManifest[],
): string[] {
  const errors: string[] = [];
  if (feature.kind !== "sourced_geographic_feature") errors.push(`Feature ${feature.id} is not sourced geography`);
  if (!ID_PATTERN.test(feature.id)) errors.push(`Invalid feature ID: ${feature.id}`);
  validateDistrictId(feature.districtId, errors);
  if (!sources.some((source) => source.id === feature.sourceId)) errors.push(`Feature ${feature.id} references unknown source ${feature.sourceId}`);
  if (!feature.sourceFeatureId.trim()) errors.push(`Feature ${feature.id} is missing a source-native ID`);
  if (!GEOJSON_GEOMETRY_TYPES.includes(feature.geometry.type)) errors.push(`Feature ${feature.id} has an unsupported GeoJSON geometry`);
  if (!ALLOWED_GEOMETRY[feature.featureKind]?.includes(feature.geometry.type)) errors.push(`${feature.featureKind} feature ${feature.id} cannot use ${feature.geometry.type} geometry`);
  if (feature.operationalStatus !== "unknown") errors.push(`Sourced feature ${feature.id} cannot assert operational availability`);
  return errors;
}

export function validateDistrictAdministrativeReference(
  reference: DistrictAdministrativeReference,
  sources: readonly GeographicSourceManifest[],
): string[] {
  const errors: string[] = [];
  validateDistrictId(reference.districtId, errors);
  if (!sources.some((source) => source.id === reference.sourceId && source.content.includes("administrative_reference"))) errors.push(`Administrative reference ${reference.sourceFeatureId} has no matching source`);
  if (!/^relation:\d+$/.test(reference.sourceFeatureId)) errors.push(`Administrative reference ${reference.sourceFeatureId} must preserve an OSM relation ID`);
  if (!isHttpsUrl(reference.sourceFeatureUrl)) errors.push(`Administrative reference ${reference.sourceFeatureId} has an invalid feature URL`);
  if (!isIsoTimestamp(reference.sourceUpdatedAt) || !isIsoTimestamp(reference.retrievedAt)) errors.push(`Administrative reference ${reference.sourceFeatureId} has invalid timestamps`);
  if (!reference.name.trim() || !reference.nameEnglish.trim() || !/^\d+$/.test(reference.adminLevel)) errors.push(`Administrative reference ${reference.sourceFeatureId} has incomplete administrative tags`);
  if (!Number.isFinite(reference.referencePoint.lat) || Math.abs(reference.referencePoint.lat) > 90 || !Number.isFinite(reference.referencePoint.lon) || Math.abs(reference.referencePoint.lon) > 180) errors.push(`Administrative reference ${reference.sourceFeatureId} has invalid reference coordinates`);
  if (reference.purpose !== "directory_label_only" || reference.boundaryGeometryVerified !== false || reference.displayOnOperationalMap !== false) errors.push(`Administrative reference ${reference.sourceFeatureId} cannot enable boundary or operational map claims`);
  return errors;
}
