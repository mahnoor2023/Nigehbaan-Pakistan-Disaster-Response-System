"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import KarachiOverview from "@/components/KarachiOverview";
import {
  ancestorsOf,
  childrenOf,
  geographyCatalog,
  karachiDistricts,
  provincesAndTerritories,
  type AdministrativeUnit,
  type CoverageStatus,
} from "@/lib/geography";
import { demoAreaForDistrict, districtHasMapCoordinates, withDistrictQuery } from "@/lib/districtSelection";
import { districtAdministrativeReference } from "@/lib/geographicSources";
import { actions } from "@/lib/store";
import { useData } from "@/lib/useData";
import { useDistrictSelection } from "@/lib/useDistrictSelection";

const SINDH_ID = "pk-sindh";

const badgeStyles: Record<CoverageStatus, string> = {
  directory_only: "border-slate-200 bg-slate-100 text-slate-700",
  demo_available: "border-emerald-200 bg-emerald-100 text-emerald-800",
  operational: "border-blue-200 bg-blue-100 text-blue-800",
};

const badgeLabels: Record<CoverageStatus, string> = {
  directory_only: "Directory only",
  demo_available: "Limited demo",
  operational: "Operational",
};

function CoverageBadge({ status }: { status: CoverageStatus }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badgeStyles[status]}`}>{badgeLabels[status]}</span>;
}

function matches(item: AdministrativeUnit, query: string): boolean {
  return [item.name, ...item.aliases].join(" ").toLowerCase().includes(query.trim().toLowerCase());
}

export default function CoveragePage() {
  return <Suspense fallback={<CoverageFallback />}><CoverageContent /></Suspense>;
}

function CoverageFallback() {
  return <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:py-12"><div className="rounded-[28px] border border-slate-200 bg-white p-10 text-sm text-slate-500">Loading location explorer…</div></main>;
}

function CoverageContent() {
  const [provinceId, setProvinceId] = useState(SINDH_ID);
  const [query, setQuery] = useState("");
  const { districtId, selectDistrict } = useDistrictSelection();
  const { areas, households, shelters, loading, error } = useData();

  const selectedProvince = geographyCatalog.units.find((item) => item.id === provinceId) ?? provincesAndTerritories[0];
  const isSindh = selectedProvince.id === SINDH_ID;
  const selectedDistrict = isSindh ? karachiDistricts.find((item) => item.id === districtId) : undefined;
  const selectedAreaId = selectedDistrict ? demoAreaForDistrict(selectedDistrict.id) : null;
  const hasMap = selectedDistrict ? districtHasMapCoordinates(selectedDistrict.id) : false;
  const administrativeReference = selectedDistrict ? districtAdministrativeReference(selectedDistrict.id) : null;
  const subdivisions = selectedDistrict ? childrenOf(selectedDistrict.id) : [];
  const breadcrumbs = selectedDistrict ? ancestorsOf(selectedDistrict.id) : ancestorsOf(selectedProvince.id);
  const householdCount = households.filter((item) => item.area === selectedAreaId).length;
  const shelterCount = shelters.filter((item) => item.area === selectedAreaId).length;
  const searchResults = useMemo(() => query.trim()
    ? geographyCatalog.units.filter((item) => item.level !== "country" && matches(item, query)).slice(0, 8)
    : [], [query]);

  function selectProvince(nextId: string) {
    setProvinceId(nextId);
  }

  function selectSearchResult(item: AdministrativeUnit) {
    const path = ancestorsOf(item.id);
    const province = path.find((entry) => entry.level === "province_territory");
    const district = path.find((entry) => entry.level === "district");
    if (province) setProvinceId(province.id);
    if (district) selectDistrict(district.id);
    setQuery("");
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 space-y-7 px-4 py-8 sm:px-6 lg:py-12">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-sky-800">Pakistan-wide geographic foundation</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Coverage map</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Navigate Karachi&apos;s seven district exercises. Only Malir has sourced map points; district boundaries are not verified.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={withDistrictQuery("/command", "", districtId)} onClick={() => { if (selectedAreaId) actions.setArea(selectedAreaId); actions.setDistrict(districtId); }} className="rounded-xl bg-sky-700 px-5 py-3 text-sm font-bold text-white hover:bg-sky-800">Open selected district demo →</Link>
            <a href="#karachi-districts" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Browse districts</a>
          </div>
        </div>
      </section>

      <KarachiOverview districtId={districtId} onDistrictSelect={(id) => { setProvinceId(SINDH_ID); selectDistrict(id, "push"); }} households={households} shelters={shelters} />

      <section aria-label="Catalog summary" className="grid gap-4 md:grid-cols-3">
        {[
          ["National directory", "7", "Provinces and territories represented"],
          ["Karachi", "7 districts", "31 official subdivisions catalogued"],
          ["District boundaries", "Unavailable", "No unverified polygons displayed"],
        ].map(([title, value, detail]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-700">Location explorer</p>
          <h2 className="mt-2 text-2xl font-extrabold">Navigate Pakistan</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Search known locations or start with a province or territory. Missing districts are intentionally not invented.</p>

          <label className="mt-6 block text-sm font-semibold text-slate-700">Search catalog
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Malir, Lyari, AJK…" className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3" />
          </label>
          {query.trim() && (
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200" role="region" aria-label="Search results">
              {searchResults.length > 0 ? searchResults.map((item) => (
                <button key={item.id} type="button" onClick={() => selectSearchResult(item)} className="flex w-full items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 text-left last:border-0 hover:bg-sky-50">
                  <span><strong className="block text-sm text-slate-900">{item.name}</strong><span className="text-xs capitalize text-slate-500">{item.level.replace("_", " / ")}</span></span>
                  <CoverageBadge status={item.coverageStatus} />
                </button>
              )) : <p className="px-4 py-3 text-sm text-slate-500">No verified catalog entry matches this search.</p>}
            </div>
          )}

          <label className="mt-5 block text-sm font-semibold text-slate-700">Province / territory
            <select value={selectedProvince.id} onChange={(event) => selectProvince(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 p-3">
              {provincesAndTerritories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>

          <label className="mt-5 block text-sm font-semibold text-slate-700">District
            <select disabled={!isSindh} value={selectedDistrict?.id ?? ""} onChange={(event) => selectDistrict(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 p-3 disabled:cursor-not-allowed disabled:text-slate-400">
              {isSindh ? karachiDistricts.map((item) => <option key={item.id} value={item.id}>Karachi {item.name}</option>) : <option value="">District directory not yet verified</option>}
            </select>
          </label>

          <nav aria-label="Location breadcrumbs" className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {breadcrumbs.map((item, index) => <span key={item.id} className="flex items-center gap-2"><span className={index === breadcrumbs.length - 1 ? "font-bold text-sky-700" : ""}>{item.name}</span>{index < breadcrumbs.length - 1 && <span aria-hidden="true">/</span>}</span>)}
          </nav>
        </div>

        <div className={`rounded-2xl border p-6 sm:p-8 ${selectedDistrict ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3"><CoverageBadge status={selectedDistrict?.coverageStatus ?? selectedProvince.coverageStatus} /><span className="text-xs font-semibold text-slate-500">Catalog v{geographyCatalog.schemaVersion}</span></div>
          <h2 className="mt-5 text-3xl font-extrabold text-slate-900">{selectedDistrict ? `Karachi ${selectedDistrict.name}` : selectedProvince.name}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {selectedDistrict
              ? hasMap
                ? "A limited Malir (Cantt side) synthetic scenario uses sourced OpenStreetMap location points. This is not district-wide coverage or an operational emergency service."
                : "A deterministic, district-specific synthetic response exercise is available on an abstract operating grid. No boundary or point geometry is shown, and simulated sites are not real facilities."
                : "This province or territory is represented in the national hierarchy. Its division and district directory has not yet been retrieved and verified."}
          </p>

          {administrativeReference && <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950"><p className="font-bold">Sourced administrative reference</p><p className="mt-1 leading-6"><a className="underline" href={administrativeReference.sourceFeatureUrl} target="_blank" rel="noreferrer">OpenStreetMap relation {administrativeReference.sourceFeatureId.replace("relation:", "")}</a> identifies {administrativeReference.nameEnglish} at administrative level {administrativeReference.adminLevel}. Retrieved {administrativeReference.retrievedAt.slice(0, 10)} under ODbL.</p><p className="mt-1 text-xs leading-5 text-sky-800">Its search reference point is directory-label metadata only. No polygon was downloaded or verified, and this point is never used for response markers, routing, or district simulation.</p></div>}

          {selectedDistrict && <div className="mt-6"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Official subdivisions ({subdivisions.length})</h3><div className="mt-3 flex flex-wrap gap-2">{subdivisions.map((item) => <span key={item.id} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">{item.name}</span>)}</div></div>}

          {selectedDistrict && <><div className="mt-6 grid grid-cols-3 gap-3">
            {[["Households", loading ? "…" : String(householdCount)], ["Shelters", loading ? "…" : String(shelterCount)], ["Scenario", areas.some((item) => item.id === selectedAreaId) ? "Ready" : "Missing"]].map(([label, value]) => <div key={label} className="rounded-xl border border-emerald-100 bg-white p-3"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-2xl font-extrabold">{value}</p></div>)}
          </div><Link href={withDistrictQuery("/command", "", selectedDistrict.id)} onClick={() => { if (selectedAreaId) actions.setArea(selectedAreaId); }} className="mt-6 inline-block rounded-xl bg-[#0875bd] px-5 py-3 text-sm font-bold text-white hover:bg-sky-700">Launch {selectedDistrict.name} demo →</Link></>}
        </div>
      </section>

      <section id="karachi-districts" className="scroll-mt-36 rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-sky-700">First detailed MVP area</p><h2 className="mt-2 text-2xl font-extrabold">Karachi&apos;s seven districts</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Administrative names follow the Commissioner Karachi directory. Every district has synthetic exercise data; the directory itself does not claim operational coverage.</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">31 subdivisions total</span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {karachiDistricts.map((district) => {
            const count = childrenOf(district.id).length;
            const selected = selectedDistrict?.id === district.id;
            return <button key={district.id} type="button" onClick={() => { setProvinceId(SINDH_ID); selectDistrict(district.id, "push"); }} className={`rounded-2xl border p-5 text-left ${selected ? "border-sky-400 bg-sky-50 ring-2 ring-sky-100" : "border-slate-200 bg-slate-50 hover:border-sky-300 hover:bg-white"}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Karachi district</p><h3 className="mt-1 text-xl font-extrabold text-slate-900">{district.name}</h3></div><CoverageBadge status={district.coverageStatus} /></div>
              <p className="mt-5 text-sm text-slate-600">{count} {count === 1 ? "subdivision" : "subdivisions"}</p><span className="mt-3 inline-block text-xs font-bold text-sky-700">Select district →</span>
            </button>;
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600"><h2 className="font-bold text-slate-900">Sources and provenance</h2><ul className="mt-3 space-y-3">{geographyCatalog.sources.map((source) => <li key={source.id}><a className="font-semibold text-sky-700 underline" href={source.url} target="_blank" rel="noreferrer">{source.publisher}: {source.title}</a><br /><span className="text-xs">Retrieved {source.retrievedAt}. {source.note}</span></li>)}</ul></div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><h2 className="font-bold">Coverage limitations</h2><ul className="mt-3 list-disc space-y-2 pl-5">{geographyCatalog.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </section>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">Demo data loading failed: {error}</p>}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><strong>Prototype data notice.</strong> Household attributes, demo-list membership, shelter capacities and rescue resources are synthetic scenario values. Administrative directory records do not indicate live service availability. This is not a live emergency service; do not use it to dispatch real rescue operations.</section>
    </main>
  );
}
