"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { withDistrictQuery } from "@/lib/districtSelection";
import { karachiDistricts } from "@/lib/geography";
import { DEFAULT_KARACHI_MAP_LAYERS, karachiMapAvailability, type KarachiMapLayers } from "@/lib/karachiMap";
import type { Household, Shelter } from "@/lib/types";

const KarachiOverviewMap = dynamic(() => import("./KarachiOverviewMap"), {
  ssr: false,
  loading: () => <div role="status" className="flex h-full items-center justify-center text-sm text-slate-600">Loading Karachi map…</div>,
});

type Props = {
  districtId: string;
  onDistrictSelect: (id: string) => void;
  households: Household[];
  shelters: Shelter[];
};

export default function KarachiOverview({ districtId, onDistrictSelect, households, shelters }: Props) {
  const [layers, setLayers] = useState<KarachiMapLayers>(DEFAULT_KARACHI_MAP_LAYERS);
  const [focusDistrict, setFocusDistrict] = useState(false);
  const previousDistrict = useRef(districtId);
  const availability = karachiMapAvailability(districtId);
  const district = karachiDistricts.find((item) => item.id === districtId);
  const toggle = (key: keyof KarachiMapLayers) => setLayers((current) => ({ ...current, [key]: !current[key] }));

  useEffect(() => {
    if (previousDistrict.current !== districtId) {
      previousDistrict.current = districtId;
      setFocusDistrict(true);
    }
  }, [districtId]);

  return <section id="karachi-map" aria-labelledby="karachi-map-title" className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
      <div>
        <p className="text-sm font-semibold text-sky-800">Karachi geographic overview</p>
        <h2 id="karachi-map-title" className="mt-1 text-2xl font-bold text-slate-900">Explore the city</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">OpenStreetMap basemap · no verified district boundaries.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={!focusDistrict} onClick={() => setFocusDistrict(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">City overview</button>
        <Link href={withDistrictQuery("/command", "", districtId)} className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">Open {district?.name ?? "selected"} demo</Link>
      </div>
    </div>

    <div className="grid xl:grid-cols-[minmax(0,1fr)_270px]">
      <div className="min-w-0 border-b border-slate-200 lg:border-b-0 lg:border-r">
        <div className="h-[340px] w-full sm:h-[480px] xl:h-[560px]" aria-describedby="karachi-map-alternative">
          <KarachiOverviewMap key={districtId} districtId={focusDistrict ? districtId : ""} layers={layers} households={households} shelters={shelters} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
          <span>Basemap: <a className="underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors · ODbL</a></span>
          <span>City reference: <a className="underline" href="https://www.wikidata.org/wiki/Q8660" target="_blank" rel="noreferrer">Wikidata Q8660 · CC0</a></span>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Select district</h3>
          <p id="karachi-map-alternative" className="mt-1 text-sm leading-5 text-slate-600">The map is optional. Choose any district below to explore its separate synthetic demonstration.</p>
          <label htmlFor="karachi-map-district" className="mt-3 block text-sm font-semibold text-slate-700">Karachi district</label>
          <select id="karachi-map-district" value={districtId} onChange={(event) => { setFocusDistrict(true); onDistrictSelect(event.target.value); }} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">
            {karachiDistricts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <p role="status" aria-live="polite" className="mt-2 text-sm leading-5 text-slate-600">
            {focusDistrict && availability.malirPointsAvailable ? "Malir detail: limited sourced point samples; response attributes are simulated." : `${district?.name ?? "This district"} selected. ${focusDistrict ? "No mapped household points for this district." : "Map at city scale."} Synthetic exercise available via Command Center.`}
          </p>
        </div>

        <fieldset className="space-y-2 border-t border-slate-200 pt-4">
          <legend className="text-sm font-bold text-slate-900">Map layers</legend>
          <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={false} disabled aria-label="District boundaries unavailable" className="mt-1 accent-sky-700" />District boundaries <span className="text-xs text-slate-500">(not verified)</span></label>
          <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={layers.sourcedFeatures} onChange={() => toggle("sourcedFeatures")} aria-label="Sourced geographic reference points" className="mt-1 accent-sky-700" />Sourced geographic points</label>
          <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={layers.simulation} onChange={() => toggle("simulation")} disabled={!availability.malirPointsAvailable} aria-label="Simulated Malir scenario markers" className="mt-1 accent-sky-700" />Simulated scenario markers <span className="text-xs text-slate-500">(Malir only)</span></label>
          <label className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={layers.shelterCandidates} onChange={() => toggle("shelterCandidates")} disabled={!availability.malirPointsAvailable} aria-label="Malir sourced facility candidates" className="mt-1 accent-sky-700" />Facility candidates <span className="text-xs text-slate-500">(Malir only)</span></label>
        </fieldset>

        <div className="border-t border-slate-200 pt-4 text-sm leading-5 text-slate-600">
          <p className="font-bold text-slate-900">Map key</p>
          <p><span className="text-teal-700">●</span> City reference · ● OSM-derived building sample · <span className="text-sky-700">●</span> synthetic scenario at a sampled point · <span className="text-indigo-700">●</span> OSM facility candidate.</p>
          <p className="mt-2">Neither sampled buildings nor candidate facilities are verified households or operational shelters. Capacities, assignments and ETAs are simulated.</p>
        </div>
      </div>
    </div>
  </section>;
}
