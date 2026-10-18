/** Screening for candidate GeoJSON boundaries. Passing this is not source/currentness verification. */
export type PolygonGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
};

type Point = [number, number];

function same(a: Point, b: Point): boolean { return a[0] === b[0] && a[1] === b[1]; }
function cross(a: Point, b: Point, c: Point): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}
function onSegment(a: Point, b: Point, c: Point): boolean {
  return Math.min(a[0], b[0]) <= c[0] && c[0] <= Math.max(a[0], b[0])
    && Math.min(a[1], b[1]) <= c[1] && c[1] <= Math.max(a[1], b[1]);
}
function intersects(a: Point, b: Point, c: Point, d: Point): boolean {
  const abC = cross(a, b, c), abD = cross(a, b, d);
  const cdA = cross(c, d, a), cdB = cross(c, d, b);
  if ((abC > 0 && abD < 0 || abC < 0 && abD > 0) && (cdA > 0 && cdB < 0 || cdA < 0 && cdB > 0)) return true;
  return (abC === 0 && onSegment(a, b, c)) || (abD === 0 && onSegment(a, b, d))
    || (cdA === 0 && onSegment(c, d, a)) || (cdB === 0 && onSegment(c, d, b));
}

function validateRing(value: unknown, name: string): string[] {
  const errors: string[] = [];
  if (!Array.isArray(value) || value.length < 4) return [`${name} must have at least four positions`];
  const points: Point[] = [];
  for (const position of value) {
    if (!Array.isArray(position) || position.length !== 2 || !position.every((n) => typeof n === "number" && Number.isFinite(n))) {
      errors.push(`${name} has an invalid WGS84 position`);
      continue;
    }
    const [lon, lat] = position as Point;
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) errors.push(`${name} has coordinates outside WGS84 ranges`);
    // Broad plausibility guard only; these limits are not district boundaries.
    if (lon < 65 || lon > 69 || lat < 23 || lat > 27) errors.push(`${name} has an implausible Karachi extent`);
    points.push([lon, lat]);
  }
  if (points.length !== value.length) return errors;
  if (!same(points[0], points.at(-1)!)) errors.push(`${name} is not closed`);
  let twiceArea = 0;
  for (let i = 0; i < points.length - 1; i++) twiceArea += points[i][0] * points[i + 1][1] - points[i + 1][0] * points[i][1];
  if (Math.abs(twiceArea) < 1e-10) errors.push(`${name} has zero area`);
  const segments = points.length - 1;
  for (let i = 0; i < segments; i++) for (let j = i + 1; j < segments; j++) {
    if (j === i + 1 || (i === 0 && j === segments - 1)) continue;
    if (intersects(points[i], points[i + 1], points[j], points[j + 1])) errors.push(`${name} self-intersects`);
  }
  return [...new Set(errors)];
}

/** Reject non-polygons, non-WGS84 CRS, malformed rings and obvious topology errors. */
export function validateKarachiBoundaryGeometry(geometry: unknown, crs: string): string[] {
  if (crs !== "EPSG:4326") return ["Boundary CRS must be EPSG:4326 (GeoJSON longitude, latitude)"];
  if (!geometry || typeof geometry !== "object") return ["Boundary must be a GeoJSON Polygon or MultiPolygon"];
  const candidate = geometry as { type?: unknown; coordinates?: unknown };
  if (candidate.type !== "Polygon" && candidate.type !== "MultiPolygon") return ["Boundary must be a GeoJSON Polygon or MultiPolygon"];
  const polygons = candidate.type === "Polygon" ? [candidate.coordinates] : candidate.coordinates;
  if (!Array.isArray(polygons) || !polygons.length) return ["Boundary contains no polygons"];
  const errors: string[] = [];
  polygons.forEach((polygon, polygonIndex) => {
    if (!Array.isArray(polygon) || !polygon.length) { errors.push(`Polygon ${polygonIndex} has no rings`); return; }
    polygon.forEach((ring, ringIndex) => errors.push(...validateRing(ring, `Polygon ${polygonIndex} ring ${ringIndex}`)));
  });
  return [...new Set(errors)];
}
