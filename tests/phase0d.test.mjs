import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { planDispatch } from "../src/lib/dispatch.ts";
import { advanceTileAvailability, initialTileAvailability } from "../src/lib/mapTiles.ts";
import {
  assignDistrictMissionResponder, canTransitionMissionStatus, createDistrictMission,
  parseMissionStore, updateDistrictMissionStatus,
} from "../src/lib/missions.ts";
import { areaStats, scoreHousehold } from "../src/lib/scoring.ts";
import { syntheticDistrictScenarios } from "../src/lib/syntheticScenarios.ts";

const west = syntheticDistrictScenarios.find((item) => item.area.id === "demo-west");
const central = syntheticDistrictScenarios.find((item) => item.area.id === "demo-central");
const directory = (scenario) => ({
  districtId: scenario.manifest.districtId,
  householdIds: scenario.households.map((item) => item.id),
  responders: scenario.resources.map((item) => ({ id: item.id, label: item.label })),
});
const directories = syntheticDistrictScenarios.map(directory);

function oneHouseholdPlan(occupied, shelterCapacity = 3) {
  const household = west.households[0];
  const scored = { ...scoreHousehold(household, areaStats([household]), 0.9, null, null), score: 50, people: 8, need: "boat" };
  const boat = { ...west.resources.find((item) => item.type === "boat"), capacity: 6 };
  const shelter = { ...west.shelters[0], capacity: shelterCapacity };
  return { plan: planDispatch([scored], [boat], [shelter], { [shelter.id]: occupied }), shelter };
}

test("partial dispatch accounts for every person without exceeding shelter capacity", () => {
  const { plan, shelter } = oneHouseholdPlan(0);
  assert.equal(plan.assignments[0].load, 3);
  assert.equal(plan.unserved[0].people, 5);
  assert.equal(plan.peopleAtRisk, plan.peopleServed + plan.unserved.reduce((sum, item) => sum + item.people, 0));
  assert.equal(plan.shelterLoad[shelter.id], shelter.capacity);
});

test("negative, corrupt and excessive persisted occupancy cannot overbook a shelter", () => {
  for (const occupied of [-100, "corrupt", Number.NaN, 1000]) {
    const { plan, shelter } = oneHouseholdPlan(occupied);
    assert.ok((plan.shelterLoad[shelter.id] ?? 0) <= shelter.capacity);
    assert.equal(plan.peopleAtRisk, plan.peopleServed + plan.unserved.reduce((sum, item) => sum + item.people, 0));
  }
  assert.equal(oneHouseholdPlan(1000).plan.unserved[0].reason, "All shelters are full");
});

test("all seven Karachi scenarios remain capacity-safe with malformed saved occupancy", () => {
  const malir = {
    households: JSON.parse(readFileSync(new URL("../public/data/households.json", import.meta.url), "utf8")),
    shelters: JSON.parse(readFileSync(new URL("../public/data/shelters.json", import.meta.url), "utf8")),
    resources: JSON.parse(readFileSync(new URL("../public/data/resources.json", import.meta.url), "utf8")),
  };
  for (const scenario of [...syntheticDistrictScenarios, malir]) {
    const scored = scenario.households.map((household) => scoreHousehold(household, areaStats(scenario.households), 0.9, null, null));
    const occupied = Object.fromEntries(scenario.shelters.map((shelter) => [shelter.id, -100]));
    const plan = planDispatch(scored, scenario.resources, scenario.shelters, occupied);
    for (const shelter of scenario.shelters) assert.ok((plan.shelterLoad[shelter.id] ?? 0) <= shelter.capacity, shelter.id);
    assert.equal(plan.peopleAtRisk, plan.peopleServed + plan.unserved.reduce((sum, item) => sum + item.people, 0));
  }
});

test("mission JSON round-trip retains district ownership and quarantine", () => {
  const mission = createDistrictMission({ householdId: west.households[0].id, responderId: west.resources[0].id, notes: "Exercise" }, directory(west), "west-1", 100).mission;
  const raw = JSON.stringify({ version: 2, missions: [mission, { ...mission, id: "foreign", districtId: west.manifest.districtId, householdId: central.households[0].id }], quarantined: [] });
  const loaded = parseMissionStore(raw, directories);
  const reloaded = parseMissionStore(JSON.stringify(loaded), directories);
  assert.equal(reloaded.missions.length, 1);
  assert.equal(reloaded.missions[0].districtId, west.manifest.districtId);
  assert.equal(reloaded.quarantined.length, 1);
  assert.equal(parseMissionStore(JSON.stringify({ unexpected: "preserve me" }), directories).quarantined.length, 1);
});

test("mission status progresses only in order; unassigned missions require a local team", () => {
  const pending = createDistrictMission({ householdId: west.households[0].id, responderId: null, notes: "" }, directory(west), "pending-1", 100).mission;
  let store = { version: 2, missions: [pending], quarantined: [] };
  assert.equal(canTransitionMissionStatus(pending, "Completed"), false);
  assert.equal(updateDistrictMissionStatus(store, pending.id, west.manifest.districtId, "Completed", 101).missions[0].status, "Pending");
  assert.equal(updateDistrictMissionStatus(store, pending.id, west.manifest.districtId, "Assigned", 101).missions[0].status, "Pending");
  assert.equal(assignDistrictMissionResponder(store, pending.id, directory(west), central.resources[0].id, 102), store);
  store = assignDistrictMissionResponder(store, pending.id, directory(west), west.resources[0].id, 103);
  assert.equal(store.missions[0].status, "Assigned");
  for (const status of ["En Route", "Rescued", "Completed"]) {
    store = updateDistrictMissionStatus(store, pending.id, west.manifest.districtId, status, 104);
    assert.equal(store.missions[0].status, status);
  }
  assert.equal(updateDistrictMissionStatus(store, pending.id, west.manifest.districtId, "Pending", 105).missions[0].status, "Completed");
});

test("tile failures and timeout show fallback only while no tiles have loaded", () => {
  const oneFailure = advanceTileAvailability(initialTileAvailability, "error");
  assert.equal(oneFailure.status, "loading");
  assert.equal(advanceTileAvailability(oneFailure, "timeout").status, "unavailable");
  const ready = advanceTileAvailability(oneFailure, "load");
  assert.equal(advanceTileAvailability(ready, "error").status, "ready");
  assert.equal(advanceTileAvailability(ready, "timeout").status, "ready");
});

test("affected forms and map fallback expose accessible labels and status", () => {
  const file = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  assert.match(file("src/app/households/page.tsx"), /aria-label="Search household ID"/);
  assert.match(file("src/app/field/page.tsx"), /aria-label="Report latitude"/);
  assert.match(file("src/app/shelter/page.tsx"), /aria-label=\{`\$\{d > 0/);
  assert.match(file("src/app/missions/page.tsx"), /Exercise status for/);
  assert.match(file("src/components/MapView.tsx"), /role="status"/);
});
