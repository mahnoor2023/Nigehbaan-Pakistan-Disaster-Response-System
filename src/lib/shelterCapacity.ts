/** Normalize a shelter headcount so malformed input cannot create negative occupancy or overbooking. */
export function clampOccupancy(value: number, capacity: number): number {
  const safeCapacity = Number.isFinite(capacity) ? Math.max(0, Math.round(capacity)) : 0;
  const safeValue = Number.isFinite(value) ? Math.round(value) : 0;
  return Math.min(safeCapacity, Math.max(0, safeValue));
}
