"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import MapClient from "@/components/MapClient";
import { Loading } from "@/components/PageShell";
import { RES_COLOR, RES_ICON, Stat, TierBadge } from "@/components/ui";
import { districtHasMapCoordinates, withDistrictQuery } from "@/lib/districtSelection";
import type { AdministrativeUnit } from "@/lib/geography";
import { TIER_COLOR, type Tier } from "@/lib/scoring";
import { actions } from "@/lib/store";
import { useDistrictSelection } from "@/lib/useDistrictSelection";
import { useModel } from "@/lib/useModel";

const severity = (l: number) => (l < 0.35 ? "Light rain" : l < 0.7 ? "Heavy rain, nala overflowing" : "Extreme flood");

export default function CommandPage() {
  return <Suspense fallback={<CommandFallback />}><SelectedDistrictCommand /></Suspense>;
}

function CommandFallback() {
  return <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-8"><div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading district selection…</div></main>;
}

function SelectedDistrictCommand() {
  const { district } = useDistrictSelection();
  return <ScenarioCommand key={district.id} district={district} />;
}

function ScenarioCommand({ district }: { district: AdministrativeUnit }) {
  const m = useModel(district.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPlan, setShowPlan] = useState(true);
  const hasMap = districtHasMapCoordinates(district.id);

  if (m.loading || m.error || !m.area) return <div className="mx-auto w-full max-w-3xl p-4"><Loading error={m.error} /></div>;

  const { scored, plan, store } = m;
  const urgent = scored.filter((s) => s.score >= 25);
  const critical = scored.filter((s) => s.tier === "critical").length;
  const hiddenUrgent = urgent.filter((s) => s.h.source !== "simulated_listed").length;
  const sel = scored.find((s) => s.h.id === selectedId) ?? null;
  const selAssign = plan.assignments.find((a) => a.s.h.id === selectedId) ?? null;
  const selUnserved = plan.unserved.find((u) => u.s.h.id === selectedId) ?? null;

  const boatShort = Math.ceil(plan.unserved.filter((u) => u.s.need === "boat").reduce((a, u) => a + u.people, 0) / 6);
  const reasons = plan.unserved.reduce<Record<string, number>>((acc, u) => ({ ...acc, [u.reason]: (acc[u.reason] ?? 0) + 1 }), {});
  const tiers: Tier[] = ["critical", "high", "medium", "low"];

  return (
    <main className="mx-auto grid w-full max-w-[110rem] min-w-0 flex-1 gap-5 p-4 sm:p-7 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
      {/* ---------- left panel ---------- */}
      <aside className="order-1 min-w-0 space-y-4"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-sky-800">Karachi {district.name} · synthetic exercise</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Command Center</h1><p className="mt-2 text-sm leading-6 text-slate-600">Adjust conditions, inspect risk, then create an exercise mission. No live dispatch is sent.</p><div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-800">Synthetic response data</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-900">No verified boundary</span>{hasMap && <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-800">Sourced Malir points</span>}</div><div className="mt-5 flex flex-wrap gap-2"><Link href={withDistrictQuery("/missions", "", district.id)} className="rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-800">Rescue missions →</Link><Link href={withDistrictQuery("/coverage", "", district.id)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Coverage map</Link></div></section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-slate-900">1. Flood scenario</h2>
            <span className="text-sm font-semibold text-sky-800">{severity(store.level)}</span>
          </div>
          <input type="range" min={0.1} max={1} step={0.05} value={store.level} onChange={(e) => actions.setLevel(Number(e.target.value))} className="mt-2 w-full accent-sky-600" aria-label="Flood severity" />
          <div className="flex justify-between text-[11px] text-slate-500"><span>Light</span><span>Heavy</span><span>Extreme</span></div>
          <p className="mt-2 text-sm text-slate-600">Slide to recalculate risk and suggested resource allocation.</p>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <Stat label="High / critical" value={urgent.length} sub={`${critical} critical`} tone="red" />
          <Stat label="Demo-unlisted but urgent" value={hiddenUrgent} sub="simulated status / field reports" tone="amber" />
          <Stat label="Recommended seats" value={`${plan.peopleServed}`} sub={`of ${plan.peopleAtRisk} scenario people; not arrivals`} tone="green" />
          <Stat label="Unmet need" value={plan.peopleAtRisk - plan.peopleServed} sub={`${plan.unserved.length} households affected${boatShort ? ` · ~${boatShort} boats` : ""}`} tone="blue" />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          {hasMap && <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
            <input type="checkbox" checked={showPlan} onChange={(e) => setShowPlan(e.target.checked)} /> Show dispatch plan on map
          </label>}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-slate-600">
            {tiers.map((t) => <span key={t}><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: TIER_COLOR[t] }} />{t}</span>)}
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-slate-900 align-middle" />simulated unlisted</span>
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-violet-600 align-middle" />field report</span>
          </div>
          {Object.keys(reasons).length > 0 && (
            <div className="mt-2 rounded bg-amber-50 p-2 text-amber-800">
              <b>Shortfall:</b> {Object.entries(reasons).map(([r, n]) => `${n} × ${r}`).join("; ")}
            </div>
          )}
        </section>

        {sel && (
          <section className="rounded-lg border-2 border-sky-400 bg-white p-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">{sel.h.id} <span className="text-xs font-normal text-slate-500">{sel.h.source === "simulated_listed" ? "SIMULATED LISTED" : sel.h.source === "simulated_unlisted" ? "SIMULATED UNLISTED" : "browser-local field report"}</span></h2>
              <TierBadge tier={sel.tier} score={sel.score} />
            </div>
            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-sm text-slate-700">{sel.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            <div className="mt-2 grid grid-cols-2 gap-x-3 text-xs text-slate-600">
              <span>People: {sel.people}</span><span>Needs: {sel.need}</span>
              {hasMap ? <><span>Height: {sel.h.ground_height_m ?? "?"} m</span><span>Nala: {sel.h.dist_to_waterway_m != null ? `${sel.h.dist_to_waterway_m} m` : "?"}</span></> : <><span>Scenario exposure: {Math.round((sel.h.scenario_exposure_est ?? 0) * 100)}%</span><span>Position: abstract grid</span></>}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-500"><span>Data confidence</span><span>{Math.round(sel.confidence * 100)}%</span></div>
              <div className="h-1.5 rounded bg-slate-100"><div className="h-1.5 rounded bg-sky-500" style={{ width: `${sel.confidence * 100}%` }} /></div>
              {sel.missing.length > 0 && <p className="mt-1 text-xs text-amber-700">Guessed (missing): {sel.missing.join(", ")}</p>}
              {sel.unverified && <p className="text-xs font-medium text-amber-700">{hasMap ? "Unverified: send a field volunteer." : "Synthetic exercise assumption; no field verification is claimed."}</p>}
            </div>
            <div className="mt-2 rounded bg-slate-50 p-2 text-sm">
              {selAssign ? <><b style={{ color: RES_COLOR[selAssign.resource.type] }}>{selAssign.resource.label}</b> → {selAssign.shelter?.name}<div className="text-xs text-slate-500">Recommended only: {selAssign.legKm.toFixed(1)} km, simulated ETA ~{selAssign.etaMin} min, {selAssign.load} seats{selUnserved ? `; ${selUnserved.people} people still unmet` : ""}</div></>
                : selUnserved ? <span className="text-red-700">Not served: {selUnserved.reason}</span>
                : <span className="text-slate-500">Below dispatch threshold in this scenario.</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-2"><Link href={withDistrictQuery("/missions", `household=${encodeURIComponent(sel.h.id)}`, district.id)} className="rounded bg-sky-700 px-3 py-1.5 text-xs font-bold text-white">Create rescue mission →</Link>
              {hasMap && <><button onClick={() => actions.setVerification(sel.h.id, "verified")} className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white">Mark verified</button>
              <button onClick={() => actions.setVerification(sel.h.id, "not_found")} className="rounded bg-slate-600 px-2 py-1 text-xs font-medium text-white">Nobody found</button>
              {store.verifications[sel.h.id] && <button onClick={() => actions.setVerification(sel.h.id, null)} className="rounded border border-slate-300 px-2 py-1 text-xs">Undo</button>}</>}
            </div>
          </section>
        )}

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-4 py-3 text-lg font-bold text-slate-900">2. Priority list <span className="text-sm font-normal text-slate-500">(top 30)</span></h2>
          <ol>
            {scored.slice(0, 30).map((s, i) => {
              const a = plan.assignments.find((x) => x.s.h.id === s.h.id);
              return (
                <li key={s.h.id}>
                  <button onClick={() => setSelectedId(s.h.id)} className={`flex w-full items-center gap-2 border-b border-slate-50 px-4 py-2.5 text-left hover:bg-slate-50 ${selectedId === s.h.id ? "bg-sky-50" : ""}`}>
                    <span className="w-5 text-xs text-slate-400">{i + 1}</span>
                    <TierBadge tier={s.tier} score={s.score} />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700"><b>{s.h.id}</b> {s.reasons[0] ?? ""}</span>
                    {a ? <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: RES_COLOR[a.resource.type] }} title={a.why}>{RES_ICON[a.resource.type]}</span>
                      : s.score >= 15 ? <span className="text-[10px] font-semibold text-red-600">WAIT</span> : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </aside>

      {/* ---------- map ---------- */}
      <div className="order-2 h-[min(65dvh,620px)] min-h-[360px] min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-5 xl:h-[min(78dvh,780px)]">
        {hasMap ? <MapClient area={m.area} scored={scored} shelters={m.shelters} resources={m.resources} plan={plan} showPlan={showPlan} selectedId={selectedId} onSelect={setSelectedId} /> : <ScenarioOperationsBoard district={district} model={m} onSelect={setSelectedId} />}
      </div>
    </main>
  );
}

function ScenarioOperationsBoard({ district, model, onSelect }: { district: AdministrativeUnit; model: ReturnType<typeof useModel>; onSelect: (id: string) => void }) {
  return <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-6">
    <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5"><p className="text-xs font-bold uppercase tracking-widest text-violet-700">Non-map simulation workspace</p><h2 className="mt-2 text-2xl font-extrabold text-slate-900">Karachi {district.name} operating picture</h2><p className="mt-2 text-sm leading-6 text-slate-600">No validated district polygon or marker coordinates are available. Distances and ETAs use an abstract synthetic exercise grid and are not real travel estimates.</p></section>
    <div className="mt-4 grid gap-4 xl:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="font-bold text-slate-900">Simulated incidents</h3><div className="mt-3 space-y-2">{model.incidents.map((incident) => <div key={incident.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="text-sm font-semibold">{incident.label}</p><p className="text-xs text-slate-500">{incident.id} · synthetic exercise</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${incident.severity === "critical" ? "bg-red-100 text-red-700" : incident.severity === "high" ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}`}>{incident.severity}</span></div>)}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4"><h3 className="font-bold text-slate-900">Synthetic evacuation capacity · recommended only</h3><div className="mt-3 space-y-2">{model.shelters.map((shelter) => <div key={shelter.id} className="rounded-xl bg-slate-50 p-3"><div className="flex justify-between gap-2 text-sm"><span className="font-semibold">{shelter.name}</span><span>{model.plan.shelterLoad[shelter.id] ?? 0} / ~{shelter.capacity} recommended seats</span></div><div className="mt-2 h-2 rounded bg-slate-200"><div className="h-2 rounded bg-sky-500" style={{ width: `${Math.min(100, ((model.plan.shelterLoad[shelter.id] ?? 0) / shelter.capacity) * 100)}%` }} /></div></div>)}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-2"><div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">Recommended dispatch allocations</h3><span className="text-xs text-slate-500">{model.plan.assignments.length} suggested · {model.plan.peopleAtRisk - model.plan.peopleServed} people unmet</span></div><div className="mt-3 grid gap-2 md:grid-cols-2">{model.plan.assignments.slice(0, 12).map((assignment) => <button key={assignment.s.h.id} onClick={() => onSelect(assignment.s.h.id)} className="rounded-xl border border-slate-200 p-3 text-left hover:border-sky-400 hover:bg-sky-50"><p className="text-sm font-bold">{assignment.s.h.id} → {assignment.shelter?.name}</p><p className="mt-1 text-xs text-slate-500">{assignment.resource.label} · simulated ETA {assignment.etaMin} min · {assignment.load} suggested seats</p></button>)}</div>{model.plan.assignments.length === 0 && <p className="mt-3 text-sm text-slate-500">Raise the flood scenario to activate dispatch priorities.</p>}</section>
    </div>
  </div>;
}
