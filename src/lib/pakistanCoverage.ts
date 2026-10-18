import { karachiDistricts, provincesAndTerritories } from "./geography";

export type CoverageRegion = { name: string; districts: string[]; note?: string };

/** @deprecated Use the typed geography catalog. Kept as a compatibility projection for existing imports. */
export const pakistanRegions: CoverageRegion[] = provincesAndTerritories.map((region) => ({
  name: region.name,
  districts: region.id === "pk-sindh" ? karachiDistricts.map((district) => `Karachi ${district.name}`) : [],
  note: region.id === "pk-sindh" ? "Only Karachi Division districts are currently catalogued." : "District directory not yet verified.",
}));

export const KARACHI_PILOT = "Malir (Cantt side)";
