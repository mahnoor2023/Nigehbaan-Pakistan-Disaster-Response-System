import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { planDispatch } from "../src/lib/dispatch.ts";
import { createDistrictMission, missionsForDistrict, updateDistrictMissionStatus } from "../src/lib/missions.ts";
import { areaStats, scoreHousehold } from "../src/lib/scoring.ts";
import { syntheticDistrictScenarios } from "../src/lib/syntheticScenarios.ts";

const malir = {
  districtId: "pk-sindh-karachi-malir",
  areaId: "malir",
  households: JSON.parse(readFileSync(new URL("../public/data/households.json", import.meta.url), "utf8")),
  shelters: JSON.parse(readFileSync(new URL("../public/data/shelters.json", import.meta.url), "utf8")),
  resources: JSON.parse(readFileSync(new URL("../public/data/resources.json", import.meta.url), "utf8")),
};
const scenarios = [
  ...syntheticDistrictScenarios.map((scenario) => ({
    districtId: scenario.manifest.districtId,
    areaId: scenario.area.id,
    households: scenario.households,
    shelters: scenario.shelters,
    resources: scenario.resources,
  })),
  malir,
];

test("seven-district command-to-mission workflow remains isolated and capacity-safe", () => {
  let missionStore = { version: 2, missions: [], quarantined: [] };
  for (const scenario of scenarios) {
    const stats = areaStats(scenario.households);
    const low = scenario.households.map((household) => scoreHousehold(household, stats, 0.2, null, null));
    const high = scenario.households.map((household) => scoreHousehold(household, stats, 0.9, null, null));
    assert.ok(high.reduce((sum, item) => sum + item.score, 0) >= low.reduce((sum, item) => sum + item.score, 0), `${scenario.districtId} flood severity did not raise aggregate risk`);

    const plan = planDispatch(high, scenario.resources, scenario.shelters, {});
    assert.ok(plan.assignments.length > 0, `${scenario.districtId} produced no dispatch assignment`);
    for (const shelter of scenario.shelters) assert.ok((plan.shelterLoad[shelter.id] ?? 0) <= shelter.capacity, `${scenario.districtId} overbooked ${shelter.id}`);

    const assignment = plan.assignments[0];
    const directory = {
      districtId: scenario.districtId,
      householdIds: scenario.households.map((household) => household.id),
      responders: scenario.resources.map((resource) => ({ id: resource.id, label: resource.label })),
    };
    const created = createDistrictMission({ householdId: assignment.s.h.id, responderId: assignment.resource.id, notes: "Workflow QA" }, directory, `qa:${scenario.districtId}`, 100);
    assert.equal(created.error, null);
    missionStore = { ...missionStore, missions: [created.mission, ...missionStore.missions] };
    for (const [index, status] of ["En Route", "Rescued", "Completed"].entries()) {
      missionStore = updateDistrictMissionStatus(missionStore, created.mission.id, scenario.districtId, status, 200 + index);
    }
  }

  assert.equal(scenarios.length, 7);
  for (const scenario of scenarios) {
    const visible = missionsForDistrict(missionStore, scenario.districtId);
    assert.equal(visible.length, 1);
    assert.equal(visible[0].status, "Completed");
    assert.equal(visible[0].districtId, scenario.districtId);
  }
});
