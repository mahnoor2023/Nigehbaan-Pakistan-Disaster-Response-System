import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { planDispatch } from "../src/lib/dispatch.ts";
import { clampOccupancy } from "../src/lib/shelterCapacity.ts";

const household = (id, people = 3) => ({
  id,
  area: "malir",
  lat: 24.95,
  lon: 67.2,
  ground_height_m: 5,
  dist_to_waterway_m: 100,
  flood_history: 0,
  night_light: 1,
  building_area_m2: 50,
  people_count_est: people,
  oldest_age_est: 40,
  lives_alone_est: "no",
  has_disability_est: "no",
  chronic_illness_est: "none",
  floor_est: "ground",
  phone_signal_est: "yes",
  has_smartphone_est: "yes",
  income_band_est: "medium",
  source: "simulated_listed",
});

const scored = (id, people = 3) => ({
  h: household(id, people),
  score: 50,
  tier: "critical",
  hazard: 0.8,
  vuln: 0.5,
  confidence: 1,
  need: "truck",
  people,
  reasons: [],
  missing: [],
  unverified: false,
  verification: null,
  hasReport: false,
});

const shelter = { id: "MAL-S01", area: "malir", name: "Demo shelter", kind: "school", lat: 24.951, lon: 67.201, capacity: 5, capacity_is_estimate: true, placeholder: false };
const resource = { id: "MAL-T1", area: "malir", type: "truck", label: "Truck 1", capacity: 10, lat: 24.949, lon: 67.199 };

test("shelter desk occupancy is clamped to the valid range", () => {
  assert.equal(clampOccupancy(8, 5), 5);
  assert.equal(clampOccupancy(-2, 5), 0);
  assert.equal(clampOccupancy(Number.NaN, 5), 0);
});

test("dispatch never allocates more people than a shelter's remaining beds", () => {
  const plan = planDispatch([scored("H1"), scored("H2")], [resource], [shelter], {});
  assert.deepEqual(plan.assignments.map((assignment) => assignment.load), [3, 2]);
  assert.equal(plan.shelterLoad[shelter.id], shelter.capacity);

  const nearlyFull = planDispatch([scored("H3")], [resource], [shelter], { [shelter.id]: 4 });
  assert.equal(nearlyFull.assignments[0].load, 1);
  assert.equal(nearlyFull.shelterLoad[shelter.id], 1);

  const full = planDispatch([scored("H4")], [resource], [shelter], { [shelter.id]: shelter.capacity });
  assert.equal(full.assignments.length, 0);
  assert.equal(full.unserved[0].reason, "All shelters are full");
});

test("generated household labels disclose simulated demo-list status", async () => {
  const raw = await readFile(new URL("../public/data/households.json", import.meta.url), "utf8");
  const households = JSON.parse(raw);
  const labels = new Set(households.map((entry) => entry.source));

  assert.deepEqual([...labels].sort(), ["simulated_listed", "simulated_unlisted"]);
  assert.equal(households.some((entry) => ["survey", "satellite", "official"].includes(entry.source)), false);
});
