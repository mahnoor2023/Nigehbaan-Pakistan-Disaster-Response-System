"use client";
import { Suspense, useState } from "react";
import PageShell, { Loading } from "@/components/PageShell";
import { TierBadge } from "@/components/ui";
import type { Tier } from "@/lib/scoring";
import { useModel } from "@/lib/useModel";
import { useDistrictSelection } from "@/lib/useDistrictSelection";

export default function Page() {
  return <Suspense fallback={<PageShell title="Households"><Loading /></PageShell>}><HouseholdsContent /></Suspense>;
}

function HouseholdsContent() {
  const { districtId } = useDistrictSelection();
  const m = useModel(districtId);
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [src, setSrc] = useState<"all" | "simulated_listed" | "simulated_unlisted" | "field_report">("all");
  const [limit, setLimit] = useState(100);

  if (m.loading || m.error) return <PageShell title="Households"><Loading error={m.error} /></PageShell>;
  const rows = m.scored.filter((s) => (tier === "all" || s.tier === tier) && (src === "all" || s.h.source === src) && s.h.id.toLowerCase().includes(q.toLowerCase()));
  const mapped = m.area?.mapMode !== "none";

  return (
    <PageShell title="Households" subtitle={`${m.area?.label}: synthetic household records ranked by scenario priority. Demographic values are estimates, not real people.`}>
      <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <input aria-label="Search household ID" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search household ID" className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <select aria-label="Filter by priority tier" value={tier} onChange={(e) => setTier(e.target.value as Tier | "all")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="all">All tiers</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
        <select aria-label="Filter by household source" value={src} onChange={(e) => setSrc(e.target.value as typeof src)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="all">All statuses</option><option value="simulated_listed">Simulated listed</option><option value="simulated_unlisted">Simulated unlisted</option><option value="field_report">Browser-local field report</option>
        </select>
        <span role="status" className="self-center text-sm font-semibold text-slate-600">{rows.length} shown</span>
      </div>
      <p className="mb-2 text-sm text-slate-600">On smaller screens, swipe within the table to see all modelled attributes.</p>
      <div className="max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm" role="region" aria-label="Household priority table" tabIndex={0}>
        <table className="min-w-[970px] text-left text-sm">
          <thead className="bg-slate-50 text-sm text-slate-600">
            <tr>{["#", "ID", "Priority", "Source", "People", "Oldest", mapped ? "Height" : "Exposure", mapped ? "Nala" : "Position", "Confidence", "Why"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((s, i) => (
              <tr key={s.h.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-1.5 text-slate-400">{i + 1}</td>
                <td className="px-3 py-1.5 font-medium">{s.h.id}</td>
                <td className="px-3 py-1.5"><TierBadge tier={s.tier} score={s.score} /></td>
                <td className="px-3 py-1.5 text-xs">{s.h.source === "simulated_listed" ? "simulated listed" : s.h.source === "simulated_unlisted" ? "simulated unlisted" : "field report"}</td>
                <td className="px-3 py-1.5">{s.people}</td>
                <td className="px-3 py-1.5">{s.h.oldest_age_est ?? <span className="text-slate-400">?</span>}</td>
                <td className="px-3 py-1.5">{mapped ? s.h.ground_height_m ?? <span className="text-slate-400">?</span> : `${Math.round((s.h.scenario_exposure_est ?? 0) * 100)}%`}</td>
                <td className="px-3 py-1.5">{mapped ? s.h.dist_to_waterway_m ?? <span className="text-slate-400">?</span> : "abstract grid"}</td>
                <td className="px-3 py-1.5">{Math.round(s.confidence * 100)}%</td>
                <td className="px-3 py-1.5 text-xs text-slate-600">{s.reasons.join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p role="status" className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">No households match these filters.</p>}
      {rows.length > limit && <button onClick={() => setLimit(limit + 200)} className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold">Show more</button>}
    </PageShell>
  );
}
