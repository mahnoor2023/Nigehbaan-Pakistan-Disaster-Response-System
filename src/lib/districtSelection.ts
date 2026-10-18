import { karachiDistricts, type AdministrativeUnit } from "./geography.ts";

export const DISTRICT_QUERY_PARAM = "district";
export const MALIR_DISTRICT_ID = "pk-sindh-karachi-malir";
export const DEFAULT_KARACHI_DISTRICT_ID = MALIR_DISTRICT_ID;

const districtIds = new Set(karachiDistricts.map((district) => district.id));
const DISTRICT_DEMO_AREAS: Readonly<Record<string, string>> = {
  "pk-sindh-karachi-central": "demo-central",
  "pk-sindh-karachi-east": "demo-east",
  "pk-sindh-karachi-south": "demo-south",
  "pk-sindh-karachi-west": "demo-west",
  "pk-sindh-karachi-keamari": "demo-keamari",
  "pk-sindh-karachi-korangi": "demo-korangi",
  [MALIR_DISTRICT_ID]: "malir",
};

export function isKarachiDistrictId(value: string | null | undefined): boolean {
  return typeof value === "string" && districtIds.has(value);
}

export function resolveKarachiDistrictId(
  candidate: string | null | undefined,
  fallback: string | null | undefined = DEFAULT_KARACHI_DISTRICT_ID,
): string {
  if (isKarachiDistrictId(candidate)) return candidate!;
  if (isKarachiDistrictId(fallback)) return fallback!;
  return DEFAULT_KARACHI_DISTRICT_ID;
}

export function getKarachiDistrict(id: string | null | undefined): AdministrativeUnit {
  const resolved = resolveKarachiDistrictId(id);
  return karachiDistricts.find((district) => district.id === resolved)!;
}

/** Maps a geographic selection to its isolated demonstration area. */
export function demoAreaForDistrict(id: string | null | undefined): string | null {
  return id && isKarachiDistrictId(id) ? DISTRICT_DEMO_AREAS[id] ?? null : null;
}

export function districtHasMapCoordinates(id: string | null | undefined): boolean {
  return id === MALIR_DISTRICT_ID;
}

export function districtHasDemoDataset(id: string | null | undefined): boolean {
  return demoAreaForDistrict(id) !== null;
}

export function withDistrictQuery(pathname: string, query: string, districtId: string): string {
  const params = new URLSearchParams(query);
  params.set(DISTRICT_QUERY_PARAM, resolveKarachiDistrictId(districtId));
  const encoded = params.toString();
  return encoded ? `${pathname}?${encoded}` : pathname;
}
