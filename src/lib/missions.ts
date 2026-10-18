export const MISSION_STORE_VERSION = 2 as const;

export const MISSION_STATUSES = ["Pending", "Assigned", "En Route", "Rescued", "Completed"] as const;
export type MissionStatus = (typeof MISSION_STATUSES)[number];
const NEXT_STATUS: Readonly<Record<MissionStatus, MissionStatus | null>> = {
  Pending: "Assigned", Assigned: "En Route", "En Route": "Rescued", Rescued: "Completed", Completed: null,
};

export type Mission = {
  id: string;
  districtId: string;
  householdId: string;
  responderId: string | null;
  notes: string;
  status: MissionStatus;
  createdAt: number;
  updatedAt: number;
};

export type QuarantinedMission = {
  raw: unknown;
  reason: string;
  quarantinedAt: number;
};

export type MissionStore = {
  version: typeof MISSION_STORE_VERSION;
  missions: Mission[];
  quarantined: QuarantinedMission[];
};

export type MissionDirectory = {
  districtId: string;
  householdIds: readonly string[];
  responders: readonly { id: string; label: string }[];
};

type UnknownRecord = Record<string, unknown>;

const emptyStore = (): MissionStore => ({ version: MISSION_STORE_VERSION, missions: [], quarantined: [] });
const isRecord = (value: unknown): value is UnknownRecord => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";
const timestamp = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

function quarantine(raw: unknown, reason: string, now: number): QuarantinedMission {
  return { raw, reason, quarantinedAt: now };
}

function normalizeRecord(raw: unknown, directories: readonly MissionDirectory[]): { mission?: Mission; quarantined?: QuarantinedMission } {
  const now = Date.now();
  if (!isRecord(raw)) return { quarantined: quarantine(raw, "Mission is not an object", now) };

  const id = text(raw.id);
  const householdId = text(raw.householdId) || text(raw.household);
  const explicitDistrict = text(raw.districtId);
  const owner = directories.find((directory) => directory.householdIds.includes(householdId));
  if (!id || !householdId || !owner) return { quarantined: quarantine(raw, "Household ownership cannot be validated", now) };
  if (explicitDistrict && explicitDistrict !== owner.districtId) {
    return { quarantined: quarantine(raw, "Stored district conflicts with household ownership", now) };
  }

  const storedResponderId = text(raw.responderId);
  const legacyResponder = text(raw.responder);
  let responder: { id: string; label: string } | null = null;
  if (storedResponderId) {
    responder = owner.responders.find((candidate) => candidate.id === storedResponderId) ?? null;
  } else if (legacyResponder) {
    const matches = directories.flatMap((directory) => directory.responders
      .filter((candidate) => candidate.id === legacyResponder || candidate.label === legacyResponder)
      .map((candidate) => ({ ...candidate, districtId: directory.districtId })));
    if (matches.length === 1 && matches[0].districtId === owner.districtId) responder = matches[0];
  }
  if ((storedResponderId || legacyResponder) && !responder) return { quarantined: quarantine(raw, "Responder ownership cannot be validated", now) };

  const status = text(raw.status);
  const createdAt = timestamp(raw.createdAt);
  const updatedAt = timestamp(raw.updatedAt);
  if (!MISSION_STATUSES.includes(status as MissionStatus) || !createdAt || !updatedAt) {
    return { quarantined: quarantine(raw, "Mission status or timestamps are invalid", now) };
  }

  return {
    mission: {
      id,
      districtId: owner.districtId,
      householdId,
      responderId: responder?.id ?? null,
      notes: text(raw.notes).slice(0, 500),
      status: status as MissionStatus,
      createdAt,
      updatedAt,
    },
  };
}

/** Migrate legacy arrays without discarding records whose ownership cannot be proven. */
export function normalizeMissionStore(raw: unknown, directories: readonly MissionDirectory[]): MissionStore {
  const source = Array.isArray(raw) ? raw : isRecord(raw) && Array.isArray(raw.missions) ? raw.missions : [];
  const retainedQuarantine = isRecord(raw) && Array.isArray(raw.quarantined)
    ? raw.quarantined.filter(isRecord).map((item) => ({
      raw: item.raw,
      reason: text(item.reason) || "Previously quarantined mission",
      quarantinedAt: timestamp(item.quarantinedAt) ?? Date.now(),
    }))
    : [];
  const result = emptyStore();
  result.quarantined.push(...retainedQuarantine);
  if (raw !== null && !Array.isArray(raw) && (!isRecord(raw) || !Array.isArray(raw.missions))) {
    result.quarantined.push(quarantine(raw, "Unrecognized mission store shape", Date.now()));
  }
  for (const candidate of source) {
    const normalized = normalizeRecord(candidate, directories);
    if (normalized.mission) result.missions.push(normalized.mission);
    if (normalized.quarantined) result.quarantined.push(normalized.quarantined);
  }
  return result;
}

export function parseMissionStore(json: string | null, directories: readonly MissionDirectory[]): MissionStore {
  if (!json) return emptyStore();
  try {
    return normalizeMissionStore(JSON.parse(json), directories);
  } catch {
    return { ...emptyStore(), quarantined: [quarantine(json, "Mission storage is not valid JSON", Date.now())] };
  }
}

export function missionsForDistrict(store: MissionStore, districtId: string): Mission[] {
  return store.missions.filter((mission) => mission.districtId === districtId);
}

export function createDistrictMission(
  input: { householdId: string; responderId: string | null; notes: string },
  directory: MissionDirectory,
  id: string,
  now: number,
): { mission: Mission | null; error: string | null } {
  if (!directory.householdIds.includes(input.householdId)) return { mission: null, error: "Select a household owned by this district." };
  if (input.responderId && !directory.responders.some((responder) => responder.id === input.responderId)) {
    return { mission: null, error: "Select a response team owned by this district." };
  }
  return {
    mission: {
      id,
      districtId: directory.districtId,
      householdId: input.householdId,
      responderId: input.responderId,
      notes: input.notes.trim().slice(0, 500),
      status: input.responderId ? "Assigned" : "Pending",
      createdAt: now,
      updatedAt: now,
    },
    error: null,
  };
}

export function updateDistrictMissionStatus(
  store: MissionStore,
  missionId: string,
  districtId: string,
  status: MissionStatus,
  now: number,
): MissionStore {
  return {
    ...store,
    missions: store.missions.map((mission) => mission.id === missionId && mission.districtId === districtId
      ? canTransitionMissionStatus(mission, status) ? { ...mission, status, updatedAt: now } : mission
      : mission),
  };
}

export function canTransitionMissionStatus(mission: Mission, status: MissionStatus): boolean {
  return MISSION_STATUSES.includes(status) && NEXT_STATUS[mission.status] === status
    && (status !== "Assigned" || mission.responderId !== null);
}

export function assignDistrictMissionResponder(
  store: MissionStore, missionId: string, directory: MissionDirectory, responderId: string, now: number,
): MissionStore {
  if (!directory.responders.some((responder) => responder.id === responderId)) return store;
  return {
    ...store,
    missions: store.missions.map((mission) => mission.id === missionId && mission.districtId === directory.districtId && mission.status === "Pending"
      ? { ...mission, responderId, status: "Assigned", updatedAt: now } : mission),
  };
}
