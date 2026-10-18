type P = { lat: number; lon: number };
type ScenarioPoint = { lat: number | null; lon: number | null; scenario_x_km?: number | null; scenario_y_km?: number | null };
const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;
/** great-circle distance in km */
export function km(a: P, b: P): number {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Geographic distance for sourced points, or abstract scenario-grid distance for non-map simulations. */
export function distanceKm(a: ScenarioPoint, b: ScenarioPoint): number {
  if (a.lat != null && a.lon != null && b.lat != null && b.lon != null && [a.lat, a.lon, b.lat, b.lon].every(Number.isFinite)) {
    return km({ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon });
  }
  if (a.scenario_x_km != null && a.scenario_y_km != null && b.scenario_x_km != null && b.scenario_y_km != null) {
    return Math.hypot(b.scenario_x_km - a.scenario_x_km, b.scenario_y_km - a.scenario_y_km);
  }
  return Number.POSITIVE_INFINITY;
}

export function hasValidGeographicCoordinates(value: { lat: number | null; lon: number | null }): value is { lat: number; lon: number } {
  return value.lat != null && value.lon != null
    && Number.isFinite(value.lat) && Number.isFinite(value.lon)
    && Math.abs(value.lat) <= 90 && Math.abs(value.lon) <= 180;
}
