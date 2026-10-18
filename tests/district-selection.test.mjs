import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_KARACHI_DISTRICT_ID,
  MALIR_DISTRICT_ID,
  demoAreaForDistrict,
  districtHasDemoDataset,
  districtHasMapCoordinates,
  getKarachiDistrict,
  isKarachiDistrictId,
  resolveKarachiDistrictId,
  withDistrictQuery,
} from "../src/lib/districtSelection.ts";
import { karachiDistricts } from "../src/lib/geography.ts";

test("district selection accepts all seven Karachi districts and rejects unknown values", () => {
  assert.equal(karachiDistricts.length, 7);
  for (const district of karachiDistricts) assert.equal(isKarachiDistrictId(district.id), true);
  assert.equal(isKarachiDistrictId("malir"), false);
  assert.equal(isKarachiDistrictId("pk-sindh-hyderabad"), false);
  assert.equal(resolveKarachiDistrictId("not-a-district"), DEFAULT_KARACHI_DISTRICT_ID);
  assert.equal(resolveKarachiDistrictId(null, "pk-sindh-karachi-west"), "pk-sindh-karachi-west");
});

test("district query URLs preserve unrelated parameters and use stable IDs", () => {
  const href = withDistrictQuery("/command", "severity=high&district=old", "pk-sindh-karachi-east");
  const url = new URL(href, "https://nigehbaan.test");
  assert.equal(url.pathname, "/command");
  assert.equal(url.searchParams.get("severity"), "high");
  assert.equal(url.searchParams.get("district"), "pk-sindh-karachi-east");
  assert.equal(getKarachiDistrict(url.searchParams.get("district")).name, "East");
});

test("all seven districts map to isolated demos and only Malir exposes sourced map coordinates", () => {
  assert.equal(MALIR_DISTRICT_ID, DEFAULT_KARACHI_DISTRICT_ID);
  assert.equal(demoAreaForDistrict(MALIR_DISTRICT_ID), "malir");
  const areaIds = karachiDistricts.map((district) => demoAreaForDistrict(district.id));
  assert.equal(new Set(areaIds).size, 7);
  for (const district of karachiDistricts) {
    assert.equal(districtHasDemoDataset(district.id), true, `${district.name} must expose its own demo`);
    assert.equal(districtHasMapCoordinates(district.id), district.id === MALIR_DISTRICT_ID);
  }
});

test("invalid geographic input cannot accidentally unlock Malir through a custom fallback", () => {
  const invalid = "pk-sindh-karachi-invented";
  assert.equal(demoAreaForDistrict(invalid), null);
  assert.equal(resolveKarachiDistrictId(invalid, "pk-sindh-karachi-west"), "pk-sindh-karachi-west");
  assert.equal(demoAreaForDistrict(resolveKarachiDistrictId(invalid, "pk-sindh-karachi-west")), "demo-west");
});
