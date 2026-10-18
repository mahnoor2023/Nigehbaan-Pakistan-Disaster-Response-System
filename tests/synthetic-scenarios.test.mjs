import assert from "node:assert/strict";
import test from "node:test";

import { planDispatch } from "../src/lib/dispatch.ts";
import { validateSyntheticScenarioManifest } from "../src/lib/geographicData.ts";
import { hasValidGeographicCoordinates } from "../src/lib/geo.ts";
import { areaStats, scoreHousehold } from "../src/lib/scoring.ts";
import {
  generateSyntheticDistrictScenario,
  syntheticDistrictScenarios,
} from "../src/lib/syntheticScenarios.ts";

test("six non-Malir scenarios are deterministic, explicit, and district-isolated", () => {
  assert.equal(syntheticDistrictScenarios.length, 6);
  const allIds = [];
  const areaIds = new Set();

  for (const scenario of syntheticDistrictScenarios) {
    assert.deepEqual(validateSyntheticScenarioManifest(scenario.manifest), []);
    assert.equal(scenario.manifest.synthetic, true);
    assert.equal(scenario.manifest.containsRealPeople, false);
    assert.equal(scenario.area.mapMode, "none");
    assert.equal(scenario.area.center, null);
    assert.equal(areaIds.has(scenario.area.id), false);
    areaIds.add(scenario.area.id);

    for (const record of [...scenario.households, ...scenario.shelters, ...scenario.resources]) {
      assert.equal(record.area, scenario.area.id);
      assert.equal(hasValidGeographicCoordinates(record), false);
      assert.equal(Number.isFinite(record.scenario_x_km), true);
      assert.equal(Number.isFinite(record.scenario_y_km), true);
      allIds.push(record.id);
    }
    assert.equal(scenario.incidents.every((incident) => incident.area === scenario.area.id && incident.synthetic), true);
  }
  assert.equal(new Set(allIds).size, allIds.length);
});

test("map coordinate guard accepts geographic points and rejects missing or invalid values", () => {
  assert.equal(hasValidGeographicCoordinates({ lat: 24.86, lon: 67.01 }), true);
  assert.equal(hasValidGeographicCoordinates({ lat: null, lon: null }), false);
  assert.equal(hasValidGeographicCoordinates({ lat: 95, lon: 67.01 }), false);
  assert.equal(hasValidGeographicCoordinates({ lat: 24.86, lon: Number.NaN }), false);
});

test("scenario generation repeats exactly for a stable seed", () => {
  const config = { districtId: "pk-sindh-karachi-central", areaId: "demo-central", code: "CTR", name: "Central", seed: 1101, narrative: "Dense-neighbourhood urban flooding exercise" };
  assert.deepEqual(generateSyntheticDistrictScenario(config), generateSyntheticDistrictScenario(config));
});

test("dispatch stays inside each district and never overbooks a synthetic shelter", () => {
  for (const scenario of syntheticDistrictScenarios) {
    const stats = areaStats(scenario.households);
    const scored = scenario.households.map((household) => scoreHousehold(household, stats, 0.85, null, null));
    const plan = planDispatch(scored, scenario.resources, scenario.shelters, {});
    assert.ok(plan.assignments.length > 0, `${scenario.area.label} should create assignments`);
    for (const assignment of plan.assignments) {
      assert.equal(assignment.s.h.area, scenario.area.id);
      assert.equal(assignment.resource.area, scenario.area.id);
      assert.equal(assignment.shelter?.area, scenario.area.id);
      assert.equal(Number.isFinite(assignment.legKm), true);
    }
    for (const shelter of scenario.shelters) {
      assert.ok((plan.shelterLoad[shelter.id] ?? 0) <= shelter.capacity, `${shelter.id} overbooked`);
    }
  }
});
