import { GEOGRAPHIC_DATA_SCHEMA_VERSION, type SyntheticScenarioManifest } from "./geographicData.ts";
import type { Area, Household, Resource, ScenarioIncident, Shelter } from "./types.ts";

export type SyntheticDistrictScenario = {
  manifest: SyntheticScenarioManifest;
  area: Area;
  households: Household[];
  shelters: Shelter[];
  resources: Resource[];
  incidents: ScenarioIncident[];
};

type ScenarioConfig = {
  districtId: string;
  areaId: string;
  code: string;
  name: string;
  seed: number;
  narrative: string;
};

const CONFIGS: readonly ScenarioConfig[] = [
  { districtId: "pk-sindh-karachi-central", areaId: "demo-central", code: "CTR", name: "Central", seed: 1101, narrative: "Dense-neighbourhood urban flooding exercise" },
  { districtId: "pk-sindh-karachi-east", areaId: "demo-east", code: "EAS", name: "East", seed: 2203, narrative: "Drain overflow and access-congestion exercise" },
  { districtId: "pk-sindh-karachi-south", areaId: "demo-south", code: "SOU", name: "South", seed: 3307, narrative: "Coastal-rain and low-lying access exercise" },
  { districtId: "pk-sindh-karachi-west", areaId: "demo-west", code: "WES", name: "West", seed: 4409, narrative: "Hillside runoff and road-access exercise" },
  { districtId: "pk-sindh-karachi-keamari", areaId: "demo-keamari", code: "KEA", name: "Keamari", seed: 5513, narrative: "Coastal access and evacuation exercise" },
  { districtId: "pk-sindh-karachi-korangi", areaId: "demo-korangi", code: "KOR", name: "Korangi", seed: 6619, narrative: "Industrial-area drainage and transport exercise" },
] as const;

function mulberry32(seed: number): () => number {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value: number, places = 2) => Number(value.toFixed(places));
const yesNo = (rng: () => number, probability: number) => rng() < probability ? "yes" : "no";

export function generateSyntheticDistrictScenario(config: ScenarioConfig): SyntheticDistrictScenario {
  const rng = mulberry32(config.seed);
  const shelters: Shelter[] = [0, 1, 2].map((index) => ({
    id: `${config.code}-SH${index + 1}`,
    area: config.areaId,
    name: `Simulated evacuation site ${String.fromCharCode(65 + index)}`,
    kind: "synthetic_shelter",
    lat: null,
    lon: null,
    scenario_x_km: round(2 + index * 4.2),
    scenario_y_km: round(index === 1 ? 7.5 : 2.2 + index),
    capacity: 22 + index * 8,
    capacity_is_estimate: true,
    placeholder: true,
  }));

  const resources: Resource[] = [
    ["boat", 6], ["boat", 6], ["truck", 12], ["truck", 12], ["ambulance", 3],
  ].map(([type, capacity], index) => ({
    id: `${config.code}-${String(type).slice(0, 1).toUpperCase()}${index + 1}`,
    area: config.areaId,
    type: type as Resource["type"],
    label: `Simulated ${type} ${index + 1}`,
    capacity: Number(capacity),
    lat: null,
    lon: null,
    scenario_x_km: round(1 + (index % 3) * 4.4),
    scenario_y_km: round(1.2 + Math.floor(index / 3) * 5.8),
  }));

  const households: Household[] = Array.from({ length: 18 }, (_, index) => {
    const age = rng() < 0.3 ? 65 + Math.floor(rng() * 23) : 24 + Math.floor(rng() * 39);
    const disability = yesNo(rng, 0.16);
    const chronic = rng() < 0.14 ? "heart" : rng() < 0.25 ? "diabetes" : "none";
    return {
      id: `${config.code}-H${String(index + 1).padStart(3, "0")}`,
      area: config.areaId,
      lat: null,
      lon: null,
      scenario_x_km: round(0.8 + rng() * 10.4),
      scenario_y_km: round(0.8 + rng() * 8.4),
      scenario_exposure_est: round(0.2 + rng() * 0.78, 3),
      ground_height_m: null,
      dist_to_waterway_m: null,
      flood_history: null,
      night_light: null,
      building_area_m2: null,
      people_count_est: 1 + Math.floor(rng() * 8),
      oldest_age_est: age,
      lives_alone_est: yesNo(rng, age >= 70 ? 0.25 : 0.06),
      has_disability_est: disability,
      chronic_illness_est: chronic,
      floor_est: rng() < 0.72 ? "ground" : "upper",
      phone_signal_est: yesNo(rng, 0.88),
      has_smartphone_est: yesNo(rng, 0.68),
      income_band_est: rng() < 0.48 ? "low" : rng() < 0.82 ? "medium" : "high",
      source: index % 5 === 0 ? "simulated_unlisted" : "simulated_listed",
    };
  });

  const incidents: ScenarioIncident[] = [
    { id: `${config.code}-INC-01`, area: config.areaId, type: "urban_flooding", severity: "critical", label: "Simulated rapid water rise", synthetic: true },
    { id: `${config.code}-INC-02`, area: config.areaId, type: "access_disruption", severity: "high", label: "Simulated access-route disruption", synthetic: true },
    { id: `${config.code}-INC-03`, area: config.areaId, type: "medical_cluster", severity: "moderate", label: "Simulated medical-assistance cluster", synthetic: true },
  ];

  return {
    manifest: {
      schemaVersion: GEOGRAPHIC_DATA_SCHEMA_VERSION,
      kind: "synthetic_response_scenario",
      scenarioId: `scenario:${config.districtId}:flood-v1`,
      version: "1.0.0",
      districtId: config.districtId,
      generatedAt: "2026-10-18T06:00:00Z",
      geographyDatasetId: null,
      synthetic: true,
      containsRealPeople: false,
      assumptions: [
        "All households, evacuation sites, capacities, vehicles and incidents are deterministic simulated records.",
        "Abstract scenario-grid positions support allocation calculations and are never rendered as geographic map coordinates.",
      ],
    },
    area: {
      id: config.areaId,
      districtId: config.districtId,
      label: `Karachi ${config.name} — synthetic exercise`,
      center: null,
      zoom: 12,
      note: config.narrative,
      households: households.length,
      mapMode: "none",
      dataDisclosure: "No verified district polygon or marker coordinates are loaded. All response entities use an abstract synthetic scenario grid.",
    },
    households,
    shelters,
    resources,
    incidents,
  };
}

export const syntheticDistrictScenarios = CONFIGS.map(generateSyntheticDistrictScenario);

export function syntheticScenarioForDistrict(districtId: string): SyntheticDistrictScenario | null {
  return syntheticDistrictScenarios.find((scenario) => scenario.manifest.districtId === districtId) ?? null;
}
