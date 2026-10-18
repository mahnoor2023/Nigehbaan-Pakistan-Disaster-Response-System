"use client";
import { useMemo } from "react";
import { planDispatch } from "./dispatch";
import { demoAreaForDistrict } from "./districtSelection";
import { areaStats, scoreHousehold, type Evidence } from "./scoring";
import { useStore } from "./store";
import { useData } from "./useData";
import type { Household } from "./types";

const WORSE = ["none", "ankle", "knee", "waist", "above"];

/** One place that turns raw data + scenario + field reports into scored households and a dispatch plan. */
export function useModel(selectedDistrictId?: string) {
  const data = useData();
  const store = useStore();

  return useMemo(() => {
    const selectedAreaId = demoAreaForDistrict(selectedDistrictId ?? store.districtId) ?? store.area;
    const area = data.areas.find((a) => a.id === selectedAreaId) ?? null;
    const base = area ? data.households.filter((h) => h.area === area.id) : [];
    const shelters = area ? data.shelters.filter((s) => s.area === area.id) : [];
    const resources = area ? data.resources.filter((r) => r.area === area.id) : [];

    // only reports that reached the command centre (synced) count
    const reports = store.reports.filter((r) => r.synced && area && r.area === area.id);
    const evidence = new Map<string, Evidence>();
    const extra: Household[] = [];
    for (const r of reports) {
      const ev: Evidence = { water: r.water, people: r.people, needsMedical: r.needsMedical };
      if (r.householdId) {
        const prev = evidence.get(r.householdId);
        evidence.set(r.householdId, prev && WORSE.indexOf(prev.water) > WORSE.indexOf(ev.water) ? prev : ev);
      } else {
        // a household nobody knew about: build one from what the volunteer saw, everything else stays unknown (null)
        extra.push({
          id: r.id, area: r.area, lat: r.lat, lon: r.lon, scenario_x_km: null, scenario_y_km: null, scenario_exposure_est: null, ground_height_m: null, dist_to_waterway_m: null, flood_history: null, night_light: null,
          building_area_m2: null, people_count_est: r.people, oldest_age_est: null, lives_alone_est: null, has_disability_est: r.needsMedical ? "yes" : null,
          chronic_illness_est: null, floor_est: null, phone_signal_est: null, has_smartphone_est: null, income_band_est: null, source: "field_report",
        });
        evidence.set(r.id, ev);
      }
    }
    const hs = [...base, ...extra];
    const st = areaStats(base);
    const scored = hs
      .map((h) => {
        const ver = store.verifications[h.id];
        return scoreHousehold(h, st, store.level, evidence.get(h.id) ?? null, ver && ver.synced ? ver.v : null);
      })
      .sort((a, b) => b.score - a.score);

    const plan = planDispatch(scored, resources, shelters, store.shelterOcc);
    const baseline = planDispatch(scored, resources, shelters, store.shelterOcc, { order: "listed", minScore: 0 });
    const incidents = area ? data.incidents.filter((incident) => incident.area === area.id) : [];
    return { ...data, area, hs, scored, shelters, resources, incidents, plan, baseline, store, reports };
  }, [data, store, selectedDistrictId]);
}
