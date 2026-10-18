import assert from "node:assert/strict";
import test from "node:test";

import { karachiDistricts } from "../src/lib/geography.ts";
import {
  createDistrictMission,
  missionsForDistrict,
  normalizeMissionStore,
  updateDistrictMissionStatus,
} from "../src/lib/missions.ts";
import { syntheticDistrictScenarios } from "../src/lib/syntheticScenarios.ts";

const MALIR_ID = "pk-sindh-karachi-malir";
const directories = [
  ...syntheticDistrictScenarios.map((scenario) => ({
    districtId: scenario.manifest.districtId,
    householdIds: scenario.households.map((household) => household.id),
    responders: scenario.resources.map((resource) => ({ id: resource.id, label: resource.label })),
  })),
  { districtId: MALIR_ID, householdIds: ["H001", "H002"], responders: [{ id: "MAL-B1", label: "Boat 1" }] },
];

test("mission directories and switching remain isolated across all seven Karachi districts", () => {
  assert.equal(directories.length, 7);
  assert.deepEqual(new Set(directories.map((directory) => directory.districtId)), new Set(karachiDistricts.map((district) => district.id)));

  const missions = directories.map((directory, index) => {
    const result = createDistrictMission({
      householdId: directory.householdIds[0],
      responderId: directory.responders[0].id,
      notes: "Synthetic workflow test",
    }, directory, `mission-${index}`, 1_000 + index);
    assert.equal(result.error, null);
    return result.mission;
  }).filter(Boolean);
  const store = { version: 2, missions, quarantined: [] };

  for (const directory of directories) {
    const visible = missionsForDistrict(store, directory.districtId);
    assert.equal(visible.length, 1);
    assert.equal(directory.householdIds.includes(visible[0].householdId), true);
    assert.equal(directory.responders.some((responder) => responder.id === visible[0].responderId), true);
  }
});

test("a West-tagged Central household and foreign responder are quarantined, not leaked or deleted", () => {
  const raw = [{
    id: "leaked-record",
    districtId: "pk-sindh-karachi-west",
    household: "CTR-H001",
    responder: "Simulated truck 4",
    notes: "legacy record remains retained",
    status: "Assigned",
    createdAt: 100,
    updatedAt: 100,
  }];
  const store = normalizeMissionStore(raw, directories);
  assert.equal(store.missions.length, 0);
  assert.equal(store.quarantined.length, 1);
  assert.deepEqual(store.quarantined[0].raw, raw[0]);
  assert.equal(missionsForDistrict(store, "pk-sindh-karachi-west").length, 0);
  assert.equal(missionsForDistrict(store, "pk-sindh-karachi-central").length, 0);
});

test("valid legacy missions are assigned by household ownership and unique responder references migrate to IDs", () => {
  const raw = [{ id: "legacy-central", household: "CTR-H001", responder: "CTR-B1", notes: "", status: "Assigned", createdAt: 100, updatedAt: 101 }];
  const store = normalizeMissionStore(raw, directories);
  assert.equal(store.quarantined.length, 0);
  assert.equal(store.missions[0].districtId, "pk-sindh-karachi-central");
  assert.equal(store.missions[0].responderId, "CTR-B1");
});

test("ambiguous legacy responder labels are quarantined rather than attributed to the selected district", () => {
  const raw = [{ id: "ambiguous-team", household: "CTR-H001", responder: "Simulated boat 1", notes: "", status: "Assigned", createdAt: 100, updatedAt: 101 }];
  const store = normalizeMissionStore(raw, directories);
  assert.equal(store.missions.length, 0);
  assert.equal(store.quarantined.length, 1);
});

test("mission creation rejects foreign households and responders", () => {
  const west = directories.find((directory) => directory.districtId === "pk-sindh-karachi-west");
  assert.equal(createDistrictMission({ householdId: "CTR-H001", responderId: west.responders[0].id, notes: "" }, west, "bad-household", 1).mission, null);
  assert.equal(createDistrictMission({ householdId: west.householdIds[0], responderId: "KOR-B1", notes: "" }, west, "bad-team", 1).mission, null);
});

test("status updates require matching mission and selected district ownership", () => {
  const west = directories.find((directory) => directory.districtId === "pk-sindh-karachi-west");
  const mission = createDistrictMission({ householdId: west.householdIds[0], responderId: west.responders[0].id, notes: "" }, west, "west-mission", 10).mission;
  const store = { version: 2, missions: [mission], quarantined: [] };
  const wrongDistrict = updateDistrictMissionStatus(store, mission.id, "pk-sindh-karachi-central", "Completed", 20);
  assert.equal(wrongDistrict.missions[0].status, "Assigned");
  const correctDistrict = updateDistrictMissionStatus(store, mission.id, west.districtId, "En Route", 30);
  assert.equal(correctDistrict.missions[0].status, "En Route");
  assert.equal(correctDistrict.missions[0].updatedAt, 30);
});
