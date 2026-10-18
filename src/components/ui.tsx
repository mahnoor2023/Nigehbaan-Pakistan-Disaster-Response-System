import { TIER_COLOR, TIER_LABEL, type Tier } from "@/lib/scoring";

export function TierBadge({ tier, score }: { tier: Tier; score?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: TIER_COLOR[tier] }}>
      {TIER_LABEL[tier]}
      {score != null && <span className="opacity-90">{score}</span>}
    </span>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: "red" | "amber" | "green" | "blue" }) {
  const c = tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : tone === "green" ? "text-emerald-600" : tone === "blue" ? "text-sky-700" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className={`mt-2 text-3xl font-bold leading-none ${c}`}>{value}</div>
      {sub && <div className="mt-2 text-sm leading-5 text-slate-600">{sub}</div>}
    </div>
  );
}

export const RES_ICON: Record<string, string> = { boat: "B", truck: "T", ambulance: "A" };
export const RES_COLOR: Record<string, string> = { boat: "#0284c7", truck: "#7c3aed", ambulance: "#db2777" };
