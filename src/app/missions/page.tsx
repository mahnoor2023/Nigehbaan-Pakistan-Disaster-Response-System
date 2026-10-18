"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  MISSION_STATUSES, assignDistrictMissionResponder, canTransitionMissionStatus, createDistrictMission, missionsForDistrict, parseMissionStore,
  updateDistrictMissionStatus, type MissionDirectory, type MissionStatus, type MissionStore,
} from "@/lib/missions";
import { useData } from "@/lib/useData";
import { useDistrictSelection } from "@/lib/useDistrictSelection";

const KEY = "nigehbaan-demo-missions-v1";

export default function MissionsPage() {
  return <Suspense fallback={<main role="status" className="mx-auto w-full max-w-6xl flex-1 p-8 text-sm text-slate-500">Loading mission board...</main>}><SelectedDistrictMissions /></Suspense>;
}

function SelectedDistrictMissions() {
  const selection = useDistrictSelection();
  const data = useData();
  const directories = useMemo(() => buildDirectories(data.areas, data.households, data.resources), [data.areas, data.households, data.resources]);
  if (data.loading || data.error) return <main role={data.error ? "alert" : "status"} className="mx-auto w-full max-w-6xl flex-1 p-8 text-sm text-slate-500">{data.error ? `Mission data failed to load: ${data.error}` : "Loading district mission data..."}</main>;

  const directory = directories.find((item) => item.districtId === selection.districtId);
  if (!directory) return <main className="mx-auto w-full max-w-6xl flex-1 p-8 text-sm text-red-700">This district has no isolated mission directory.</main>;
  return <MissionWorkspace key={selection.districtId} districtId={selection.districtId} districtName={selection.district.name} directory={directory} directories={directories} />;
}

function buildDirectories(
  areas: ReturnType<typeof useData>["areas"],
  households: ReturnType<typeof useData>["households"],
  resources: ReturnType<typeof useData>["resources"],
): MissionDirectory[] {
  return areas.flatMap((area) => area.districtId ? [{
    districtId: area.districtId,
    householdIds: households.filter((household) => household.area === area.id).map((household) => household.id),
    responders: resources.filter((resource) => resource.area === area.id).map((resource) => ({ id: resource.id, label: resource.label })),
  }] : []);
}

function MissionWorkspace({ districtId, districtName, directory, directories }: {
  districtId: string; districtName: string; directory: MissionDirectory; directories: MissionDirectory[];
}) {
  const [store, setStore] = useState<MissionStore | null>(null);
  const [householdId, setHouseholdId] = useState("");
  const [responderId, setResponderId] = useState("");
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState<MissionStatus | "All">("All");
  const [error, setError] = useState("");
  const [pendingResponder, setPendingResponder] = useState<Record<string, string>>({});
  const persistenceFailed = useRef(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      let raw: string | null = null;
      try { raw = localStorage.getItem(KEY); } catch { /* use an in-memory mission board */ }
      const migrated = parseMissionStore(raw, directories);
      try { if (raw !== JSON.stringify(migrated)) localStorage.setItem(KEY, JSON.stringify(migrated)); }
      catch { persistenceFailed.current = true; }
      const incoming = new URLSearchParams(window.location.search).get("household")?.trim() ?? "";
      setHouseholdId(directory.householdIds.includes(incoming) ? incoming : "");
      setError(incoming && !directory.householdIds.includes(incoming) ? "The requested household does not belong to this district." : "");
      setStore(migrated);
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY) { persistenceFailed.current = false; setStore(parseMissionStore(event.newValue, directories)); }
    };
    window.addEventListener("storage", onStorage);
    return () => { active = false; window.removeEventListener("storage", onStorage); };
  }, [directories, directory.householdIds]);

  function currentStore(): MissionStore {
    if (persistenceFailed.current && store) return store;
    try {
      const raw = localStorage.getItem(KEY);
      return raw === null ? store ?? parseMissionStore(null, directories) : parseMissionStore(raw, directories);
    }
    catch { return store ?? { version: 2, missions: [], quarantined: [] }; }
  }

  function save(next: MissionStore) {
    setStore(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); persistenceFailed.current = false; setError(""); }
    catch { persistenceFailed.current = true; setError("Could not save missions on this device. Changes remain only in this open tab; check browser storage."); }
  }

  function createMission(event: React.FormEvent<HTMLFormElement>, now: number) {
    event.preventDefault();
    if (!store) return;
    const result = createDistrictMission({ householdId, responderId: responderId || null, notes }, directory, crypto.randomUUID(), now);
    if (!result.mission) return setError(result.error ?? "Mission could not be created.");
    const latest = currentStore();
    save({ ...latest, missions: [result.mission, ...latest.missions] });
    setHouseholdId(""); setResponderId(""); setNotes("");
  }

  function handleStatusChange(event: React.ChangeEvent<HTMLSelectElement>, now: number) {
    if (!store) return;
    const id = event.currentTarget.dataset.missionId;
    if (!id) return;
    save(updateDistrictMissionStatus(currentStore(), id, districtId, event.currentTarget.value as MissionStatus, now));
  }

  function assignResponder(missionId: string, now: number) {
    const responder = pendingResponder[missionId];
    if (!responder) return setError("Choose a response team before assigning this mission.");
    const latest = currentStore();
    const updated = assignDistrictMissionResponder(latest, missionId, directory, responder, now);
    if (updated === latest) return setError("Mission assignment was not accepted for this district.");
    save(updated);
  }

  const districtMissions = store ? missionsForDistrict(store, districtId) : [];
  const active = districtMissions.filter((mission) => mission.status !== "Completed").length;
  const completed = districtMissions.length - active;
  const shown = districtMissions.filter((mission) => filter === "All" || mission.status === filter);
  const responders = useMemo(() => new Map(directory.responders.map((responder) => [responder.id, responder.label])), [directory.responders]);

  return <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-7 sm:px-7 lg:py-10">
    <div className="border-b border-slate-200 pb-6"><p className="text-sm font-semibold text-sky-800">Karachi {districtName} · synthetic exercise</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Rescue missions</h1><p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">Assign simulated teams and track exercise status. Records stay in this browser; statuses are not verified rescues or shelter arrivals.</p></div>
    <div className="grid grid-cols-3 gap-2 sm:gap-3">{[["Total missions", districtMissions.length], ["Active missions", active], ["Completed", completed]].map(([label, count]) => <div key={label} className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5"><div className="text-xs leading-4 text-slate-600 sm:text-sm">{label}</div><div className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{count}</div></div>)}</div>
    {store && store.quarantined.length > 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>{store.quarantined.length} legacy mission record(s) retained outside district boards.</strong> Their household or responder ownership could not be safely validated; no record was deleted.</p>}
    <form onSubmit={(event) => createMission(event, performance.timeOrigin + event.timeStamp)} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold">Create exercise mission</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">Household *<select required value={householdId} onChange={(event) => setHouseholdId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5"><option value="">Select a {districtName} household</option>{directory.householdIds.map((id) => <option key={id} value={id}>{id}</option>)}</select></label>
        <label className="text-sm font-medium">Responder / team<select value={responderId} onChange={(event) => setResponderId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5"><option value="">Not assigned</option>{directory.responders.map((responder) => <option key={responder.id} value={responder.id}>{responder.label} ({responder.id})</option>)}</select></label>
      </div>
      <label className="block text-sm font-medium">Mission notes<textarea maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Exercise notes only" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5" /></label>
      <button className="rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800">Create mission</button>
    </form>
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">{districtName} mission board</h2><label className="text-sm">Filter mission status: <select value={filter} onChange={(event) => setFilter(event.target.value as MissionStatus | "All")} className="rounded border border-slate-300 bg-white p-2">{["All", ...MISSION_STATUSES].map((status) => <option key={status}>{status}</option>)}</select></label></div>
      {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!store ? <p role="status">Loading missions…</p> : shown.length === 0 ? <p className="rounded-xl border bg-white p-6 text-slate-600">No {districtName} missions match this view. Create an exercise mission above to get started.</p> : shown.map((mission) => <article key={mission.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">Household {mission.householdId}</h3><p className="mt-1 text-sm text-slate-600">Team: {mission.responderId ? responders.get(mission.responderId) : "Not assigned"}</p>{mission.notes && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{mission.notes}</p>}<p className="mt-2 text-xs text-slate-400">Created {new Date(mission.createdAt).toLocaleString()}</p></div><span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">{mission.status}</span></div>
        {mission.status === "Pending" && !mission.responderId && <div className="mt-4 flex flex-wrap items-center gap-2"><label htmlFor={`assign-${mission.id}`} className="text-sm font-medium">Assign simulated team for {mission.householdId}:</label><select id={`assign-${mission.id}`} value={pendingResponder[mission.id] ?? ""} onChange={(event) => setPendingResponder((current) => ({ ...current, [mission.id]: event.target.value }))} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">Select team</option>{directory.responders.map((responder) => <option key={responder.id} value={responder.id}>{responder.label}</option>)}</select><button type="button" onClick={() => assignResponder(mission.id, Date.now())} className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white">Assign team</button></div>}
        <div className="mt-4 flex flex-wrap items-center gap-2"><label htmlFor={`status-${mission.id}`} className="text-sm font-medium">Exercise status for {mission.householdId}:</label><select id={`status-${mission.id}`} data-mission-id={mission.id} value={mission.status} onChange={(event) => handleStatusChange(event, Date.now())} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{MISSION_STATUSES.filter((status) => status === mission.status || canTransitionMissionStatus(mission, status)).map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
      </article>)}
    </section>
  </main>;
}
