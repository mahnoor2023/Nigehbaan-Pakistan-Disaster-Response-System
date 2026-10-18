"use client";
import { Suspense } from "react";
import PageShell, { Loading } from "@/components/PageShell";
import { clampOccupancy } from "@/lib/shelterCapacity";
import { actions } from "@/lib/store";
import { useModel } from "@/lib/useModel";
import { useDistrictSelection } from "@/lib/useDistrictSelection";

export default function Page() {
  return <Suspense fallback={<PageShell title="Shelter Desk"><Loading /></PageShell>}><ShelterContent /></Suspense>;
}

function ShelterContent() {
  const { districtId } = useDistrictSelection();
  const m = useModel(districtId);
  if (m.loading || m.error) return <PageShell title="Shelter Desk"><Loading error={m.error} /></PageShell>;
  const { store, plan } = m;
  const cap = m.shelters.reduce((a, s) => a + s.capacity, 0);
  const occ = m.shelters.reduce((a, s) => a + clampOccupancy(store.shelterOcc[s.id] ?? 0, s.capacity), 0);
  const syntheticSites = m.area?.mapMode === "none";
  const capacityDisclosure = syntheticSites ? "All sites and capacities are synthetic exercise assumptions." : "OSM facility candidates are not verified shelters; capacities are estimates.";

  return (
    <PageShell title="Shelters" subtitle={`${m.area?.label}: ${occ} of approximately ${cap} places marked as arrived in this browser. ${capacityDisclosure} Recommendations are not arrivals.`}>
      {m.shelters.length === 0 && <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No shelter candidates or synthetic evacuation sites are catalogued for this district.</p>}
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {m.shelters.map((s) => {
          const o = clampOccupancy(store.shelterOcc[s.id] ?? 0, s.capacity);
          const incoming = plan.shelterLoad[s.id] ?? 0;
          const pct = Math.min(100, (o / s.capacity) * 100);
          const full = o >= s.capacity;
          return (
            <section key={s.id} className={`rounded-xl border bg-white p-5 shadow-sm ${full ? "border-red-400" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-2">
                <div><h2 className="text-lg font-bold leading-tight">{s.name}</h2><div className="mt-1 text-sm text-slate-600">{syntheticSites ? "Synthetic evacuation site" : "OSM facility candidate · shelter use unverified"} · estimated capacity ~{s.capacity}</div></div>
                {full ? <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">FULL</span> : o / s.capacity > 0.8 ? <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-bold">Almost full</span> : null}
              </div>
              <div className="mt-2 h-2 rounded bg-slate-100"><div className={`h-2 rounded ${full ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} /></div>
              <div className="mt-2 flex flex-wrap justify-between gap-1 text-sm text-slate-600"><span>{o} marked arrived</span><span>{incoming} suggested seats · not arrivals</span></div>
              <div className="mt-2 flex items-center gap-1">
                {[-5, -1, 1, 5].map((d) => <button key={d} aria-label={`${d > 0 ? "Add" : "Remove"} ${Math.abs(d)} ${Math.abs(d) === 1 ? "arrival" : "arrivals"} ${d > 0 ? "to" : "from"} ${s.name}`} onClick={() => actions.setOcc(s.id, o + d, s.capacity)} className="rounded border border-slate-300 px-2 py-1 text-sm">{d > 0 ? `+${d}` : d}</button>)}
                <input type="number" min={0} max={s.capacity} value={o} onChange={(e) => actions.setOcc(s.id, Number(e.target.value), s.capacity)} className="ml-auto w-20 rounded border border-slate-300 px-2 py-1 text-sm" aria-label={`Occupied beds at ${s.name} (maximum ${s.capacity})`} />
              </div>
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}
