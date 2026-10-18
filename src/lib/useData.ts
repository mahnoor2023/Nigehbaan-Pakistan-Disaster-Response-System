"use client";
import { useEffect, useState } from "react";
import { MALIR_DISTRICT_ID } from "./districtSelection";
import { syntheticDistrictScenarios } from "./syntheticScenarios";
import type { Area, Household, Resource, ScenarioIncident, Shelter } from "./types";

export type Loaded = { areas: Area[]; households: Household[]; shelters: Shelter[]; resources: Resource[]; incidents: ScenarioIncident[] };
type State = Loaded & { loading: boolean; error: string | null };
const EMPTY: Loaded = { areas: [], households: [], shelters: [], resources: [], incidents: [] };

let cache: Loaded | null = null; // survive page navigation without refetching

async function get<T>(name: string): Promise<T> {
  const r = await fetch(`/data/${name}.json`);
  if (!r.ok) throw new Error(`${name}.json: HTTP ${r.status}`);
  return r.json() as Promise<T>;
}

export function useData(): State {
  const [state, setState] = useState<State>(cache ? { ...cache, loading: false, error: null } : { ...EMPTY, loading: true, error: null });

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    Promise.all([get<Area[]>("areas"), get<Household[]>("households"), get<Shelter[]>("shelters"), get<Resource[]>("resources")])
      .then(([areas, households, shelters, resources]) => {
        cache = {
          areas: [
            ...areas.map((area) => area.id === "malir" ? {
              ...area,
              districtId: MALIR_DISTRICT_ID,
              mapMode: "sourced_points" as const,
              dataDisclosure: "Existing limited OSM-derived points with synthetic household and response attributes; not district-wide coverage.",
            } : area),
            ...syntheticDistrictScenarios.map((scenario) => scenario.area),
          ],
          households: [...households, ...syntheticDistrictScenarios.flatMap((scenario) => scenario.households)],
          shelters: [...shelters, ...syntheticDistrictScenarios.flatMap((scenario) => scenario.shelters)],
          resources: [...resources, ...syntheticDistrictScenarios.flatMap((scenario) => scenario.resources)],
          incidents: syntheticDistrictScenarios.flatMap((scenario) => scenario.incidents),
        };
        if (!cancelled) setState({ ...cache, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ ...EMPTY, loading: false, error: e instanceof Error ? e.message : String(e) });
      });
    return () => { cancelled = true; };
  }, []);

  return state;
}
