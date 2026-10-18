export const ADMIN_LEVELS = ["country", "province_territory", "division", "district", "subdivision"] as const;
export type AdminLevel = (typeof ADMIN_LEVELS)[number];

export const COVERAGE_STATUSES = ["directory_only", "demo_available", "operational"] as const;
export type CoverageStatus = (typeof COVERAGE_STATUSES)[number];

export type GeographySource = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  retrievedAt: string;
  note: string;
};

export type AdministrativeUnit = {
  /** Stable Nigehbaan identifier; it is not an ISO or government code. */
  id: string;
  parentId: string | null;
  level: AdminLevel;
  name: string;
  aliases: readonly string[];
  coverageStatus: CoverageStatus;
  sourceIds: readonly string[];
  note?: string;
};

export const geographyCatalog = {
  schemaVersion: "1.0.0",
  catalogVersion: "2026-10-18",
  idScheme: "nigehbaan-internal-v1",
  completeness: "partial" as const,
  geometryStatus: "not_included" as const,
  limitations: [
    "The seven province/territory entries form a national navigation scaffold, not a complete Pakistan district directory.",
    "Only Karachi Division districts and subdivisions have been catalogued below the province/territory level.",
    "No administrative polygons are included because a suitable authoritative or clearly licensed GeoJSON dataset was not verified for this phase.",
    "All seven Karachi districts have synthetic response demonstrations; only Malir includes the existing OSM-derived point sample.",
    "The other six district demonstrations use abstract scenario grids and do not imply verified coordinates, boundaries, facilities, or operational coverage.",
  ],
  sources: [
    {
      id: "pbs-census-2023-field-plan",
      title: "7th Population and Housing Census 2023 — Field Operation Plan",
      publisher: "Pakistan Bureau of Statistics",
      url: "https://www.pbs.gov.pk/sites/default/files/population/2023/FOP_final_26-2-23_final.pdf",
      retrievedAt: "2026-10-18",
      note: "National administrative hierarchy and province/territory context. The catalog intentionally does not infer a complete district list from this source.",
    },
    {
      id: "commissioner-karachi-area-map",
      title: "Karachi Division Administrative Area Directory",
      publisher: "Commissioner Karachi",
      url: "https://commissionerkarachi.gos.pk/area-map",
      retrievedAt: "2026-10-18",
      note: "Names Karachi Division's seven districts and 31 subdivisions. The page does not provide reusable GIS polygons.",
    },
  ] satisfies readonly GeographySource[],
  units: [
    unit("pk", null, "country", "Pakistan", [], "directory_only", ["pbs-census-2023-field-plan"]),

    unit("pk-sindh", "pk", "province_territory", "Sindh", [], "directory_only", ["pbs-census-2023-field-plan"]),
    unit("pk-punjab", "pk", "province_territory", "Punjab", [], "directory_only", ["pbs-census-2023-field-plan"]),
    unit("pk-khyber-pakhtunkhwa", "pk", "province_territory", "Khyber Pakhtunkhwa", ["KP", "KPK"], "directory_only", ["pbs-census-2023-field-plan"]),
    unit("pk-balochistan", "pk", "province_territory", "Balochistan", [], "directory_only", ["pbs-census-2023-field-plan"]),
    unit("pk-islamabad-capital-territory", "pk", "province_territory", "Islamabad Capital Territory", ["ICT"], "directory_only", ["pbs-census-2023-field-plan"]),
    unit("pk-gilgit-baltistan", "pk", "province_territory", "Gilgit-Baltistan", ["GB"], "directory_only", ["pbs-census-2023-field-plan"]),
    unit("pk-azad-jammu-kashmir", "pk", "province_territory", "Azad Jammu & Kashmir", ["AJK", "Azad Kashmir"], "directory_only", ["pbs-census-2023-field-plan"]),

    unit("pk-sindh-karachi-division", "pk-sindh", "division", "Karachi Division", ["Karachi"], "directory_only", ["commissioner-karachi-area-map"]),

    unit("pk-sindh-karachi-central", "pk-sindh-karachi-division", "district", "Central", ["Karachi Central", "District Central"], "demo_available", ["commissioner-karachi-area-map"], "Synthetic non-map response exercise; no verified district geometry or operational data."),
    unit("pk-sindh-karachi-east", "pk-sindh-karachi-division", "district", "East", ["Karachi East", "District East"], "demo_available", ["commissioner-karachi-area-map"], "Synthetic non-map response exercise; no verified district geometry or operational data."),
    unit("pk-sindh-karachi-south", "pk-sindh-karachi-division", "district", "South", ["Karachi South", "District South"], "demo_available", ["commissioner-karachi-area-map"], "Synthetic non-map response exercise; no verified district geometry or operational data."),
    unit("pk-sindh-karachi-west", "pk-sindh-karachi-division", "district", "West", ["Karachi West", "District West"], "demo_available", ["commissioner-karachi-area-map"], "Synthetic non-map response exercise; no verified district geometry or operational data."),
    unit("pk-sindh-karachi-keamari", "pk-sindh-karachi-division", "district", "Keamari", ["Karachi Keamari", "Kemari"], "demo_available", ["commissioner-karachi-area-map"], "Synthetic non-map response exercise; no verified district geometry or operational data."),
    unit("pk-sindh-karachi-korangi", "pk-sindh-karachi-division", "district", "Korangi", ["Karachi Korangi"], "demo_available", ["commissioner-karachi-area-map"], "Synthetic non-map response exercise; no verified district geometry or operational data."),
    unit("pk-sindh-karachi-malir", "pk-sindh-karachi-division", "district", "Malir", ["Karachi Malir"], "demo_available", ["commissioner-karachi-area-map"], "Limited Malir (Cantt side) synthetic demonstration data is available; district-wide coverage is not loaded."),

    ...subdivisions("pk-sindh-karachi-central", ["Gulberg", "Liaquatabad", "Nazimabad", "New Karachi", "New Nazimabad"]),
    ...subdivisions("pk-sindh-karachi-east", ["Ferozabad", "Gulshan-e-Iqbal", "Gulzar-e-Hijri", "Jamshed Quarters"]),
    ...subdivisions("pk-sindh-karachi-south", ["Arambagh", "Civil Lines", "Garden", "Lyari", "Saddar"]),
    ...subdivisions("pk-sindh-karachi-west", ["Mango Pir", "Mominabad", "Orangi Town"]),
    ...subdivisions("pk-sindh-karachi-keamari", ["Baldia", "Harbor", "Maripur", "SITE"]),
    ...subdivisions("pk-sindh-karachi-korangi", ["Korangi", "Landhi", "Model Colony", "Shah Faisal"]),
    ...subdivisions("pk-sindh-karachi-malir", ["Airport", "Bin Qasim", "Gadap", "Ibrahim Hyderi", "Murad Memon", "Shah Mureed"]),
  ] satisfies readonly AdministrativeUnit[],
};

function unit(
  id: string,
  parentId: string | null,
  level: AdminLevel,
  name: string,
  aliases: readonly string[],
  coverageStatus: CoverageStatus,
  sourceIds: readonly string[],
  note?: string,
): AdministrativeUnit {
  return { id, parentId, level, name, aliases, coverageStatus, sourceIds, ...(note ? { note } : {}) };
}

function slug(value: string): string {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function subdivisions(parentId: string, names: readonly string[]): AdministrativeUnit[] {
  return names.map((name) => unit(
    `${parentId}-${slug(name)}`,
    parentId,
    "subdivision",
    name,
    [],
    "directory_only",
    ["commissioner-karachi-area-map"],
  ));
}

const EXPECTED_PARENT: Record<Exclude<AdminLevel, "country">, AdminLevel> = {
  province_territory: "country",
  division: "province_territory",
  district: "division",
  subdivision: "district",
};

export function validateGeographyCatalog(units: readonly AdministrativeUnit[] = geographyCatalog.units): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const byId = new Map<string, AdministrativeUnit>();

  for (const item of units) {
    if (ids.has(item.id)) errors.push(`Duplicate administrative unit ID: ${item.id}`);
    ids.add(item.id);
    byId.set(item.id, item);
    if (!ADMIN_LEVELS.includes(item.level)) errors.push(`Invalid level for ${item.id}: ${item.level}`);
    if (!COVERAGE_STATUSES.includes(item.coverageStatus)) errors.push(`Invalid coverage status for ${item.id}: ${item.coverageStatus}`);
  }

  const countries = units.filter((item) => item.level === "country");
  if (countries.length !== 1) errors.push(`Expected exactly one country, found ${countries.length}`);

  for (const item of units) {
    if (item.level === "country") {
      if (item.parentId !== null) errors.push(`Country ${item.id} must not have a parent`);
      continue;
    }
    if (!item.parentId) {
      errors.push(`${item.id} is missing a parent`);
      continue;
    }
    const parent = byId.get(item.parentId);
    if (!parent) {
      errors.push(`${item.id} references missing parent ${item.parentId}`);
    } else if (parent.level !== EXPECTED_PARENT[item.level]) {
      errors.push(`${item.id} has ${parent.level} parent; expected ${EXPECTED_PARENT[item.level]}`);
    }
  }

  for (const item of units) {
    const visited = new Set<string>();
    let cursor: AdministrativeUnit | undefined = item;
    while (cursor) {
      if (visited.has(cursor.id)) {
        errors.push(`Hierarchy cycle detected at ${cursor.id}`);
        break;
      }
      visited.add(cursor.id);
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
  }

  return [...new Set(errors)];
}

export function childrenOf(parentId: string): AdministrativeUnit[] {
  return geographyCatalog.units.filter((item) => item.parentId === parentId);
}

export function ancestorsOf(id: string): AdministrativeUnit[] {
  const byId = new Map(geographyCatalog.units.map((item) => [item.id, item]));
  const result: AdministrativeUnit[] = [];
  let cursor = byId.get(id);
  while (cursor) {
    result.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  return result;
}

export const pakistan = geographyCatalog.units.find((item) => item.id === "pk")!;
export const provincesAndTerritories = childrenOf(pakistan.id);
export const karachiDivision = geographyCatalog.units.find((item) => item.id === "pk-sindh-karachi-division")!;
export const karachiDistricts = childrenOf(karachiDivision.id);
