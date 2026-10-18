import assert from "node:assert/strict";
import test from "node:test";

import {
  childrenOf,
  geographyCatalog,
  karachiDistricts,
  karachiDivision,
  provincesAndTerritories,
  validateGeographyCatalog,
} from "../src/lib/geography.ts";

test("geography catalog has unique IDs, valid parents, and no hierarchy cycles", () => {
  assert.deepEqual(validateGeographyCatalog(), []);
  assert.equal(new Set(geographyCatalog.units.map((item) => item.id)).size, geographyCatalog.units.length);
});

test("validator detects duplicate IDs, missing parents, and hierarchy cycles", () => {
  const duplicate = [...geographyCatalog.units, geographyCatalog.units[0]];
  assert.match(validateGeographyCatalog(duplicate).join("\n"), /Duplicate administrative unit ID/);

  const missingParent = geographyCatalog.units.map((item) => item.id === "pk-sindh" ? { ...item, parentId: "missing" } : item);
  assert.match(validateGeographyCatalog(missingParent).join("\n"), /references missing parent/);

  const cycle = [
    { id: "pk", parentId: null, level: "country", name: "Pakistan", aliases: [], coverageStatus: "directory_only", sourceIds: [] },
    { id: "a", parentId: "b", level: "province_territory", name: "A", aliases: [], coverageStatus: "directory_only", sourceIds: [] },
    { id: "b", parentId: "a", level: "province_territory", name: "B", aliases: [], coverageStatus: "directory_only", sourceIds: [] },
  ];
  assert.match(validateGeographyCatalog(cycle).join("\n"), /Hierarchy cycle detected/);
});

test("national scaffold includes the seven required provinces and territories", () => {
  assert.deepEqual(provincesAndTerritories.map((item) => item.name), [
    "Sindh",
    "Punjab",
    "Khyber Pakhtunkhwa",
    "Balochistan",
    "Islamabad Capital Territory",
    "Gilgit-Baltistan",
    "Azad Jammu & Kashmir",
  ]);
  assert.equal(provincesAndTerritories.every((item) => item.coverageStatus === "directory_only"), true);
});

test("Karachi contains seven districts and 31 subdivisions from the cited directory", () => {
  assert.deepEqual(karachiDistricts.map((item) => item.name), ["Central", "East", "South", "West", "Keamari", "Korangi", "Malir"]);
  assert.equal(karachiDistricts.reduce((total, district) => total + childrenOf(district.id).length, 0), 31);
  assert.equal(karachiDistricts.every((district) => district.parentId === karachiDivision.id), true);
  assert.equal(karachiDistricts.flatMap((district) => childrenOf(district.id)).every((item) => item.level === "subdivision"), true);
});

test("coverage labels expose synthetic demos for all seven districts without claiming operations", () => {
  assert.equal(karachiDistricts.every((item) => item.coverageStatus === "demo_available"), true);
  assert.equal(geographyCatalog.units.some((item) => item.coverageStatus === "operational"), false);
  assert.equal(geographyCatalog.geometryStatus, "not_included");
});

test("catalog provenance records source URLs and retrieval dates", () => {
  assert.equal(geographyCatalog.sources.length, 2);
  for (const source of geographyCatalog.sources) {
    assert.match(source.url, /^https:\/\//);
    assert.match(source.retrievedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
  const sourceIds = new Set(geographyCatalog.sources.map((source) => source.id));
  assert.equal(geographyCatalog.units.every((item) => item.sourceIds.every((sourceId) => sourceIds.has(sourceId))), true);
});
