import { isLand } from "@/components/three/globe/land";

/**
 * Globe math shared by the WebGL scene and its static SVG fallback, so both
 * show the same framing (the fallback is what the canvas fades in over).
 */

export type LonLat = readonly [number, number];
export type Vec3 = [number, number, number];

const DEG = Math.PI / 180;

export const ISTANBUL: LonLat = [28.98, 41.01];

/** Supply flows into Türkiye, orders flow out to the markets. */
export const ROUTES: ReadonlyArray<{ city: string; at: LonLat; kind: "supply" | "sale" }> = [
  { city: "Shenzhen", at: [114.06, 22.54], kind: "supply" },
  { city: "Yiwu", at: [120.07, 29.31], kind: "supply" },
  { city: "Berlin", at: [13.4, 52.52], kind: "sale" },
  { city: "Londra", at: [-0.13, 51.51], kind: "sale" },
  { city: "Amsterdam", at: [4.9, 52.37], kind: "sale" },
  { city: "Dubai", at: [55.27, 25.2], kind: "sale" },
  { city: "New York", at: [-74.0, 40.71], kind: "sale" },
  { city: "Toronto", at: [-79.38, 43.65], kind: "sale" },
  { city: "Los Angeles", at: [-118.24, 34.05], kind: "sale" },
];

/** Türkiye's dots are drawn in gold. */
export function isTurkey(lon: number, lat: number): boolean {
  return lon > 26 && lon < 44.8 && lat > 36 && lat < 42.1 && !(lon < 29 && lat > 41.3);
}

export function lonLatToVec3([lon, lat]: LonLat, radius = 1): Vec3 {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return [-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)];
}

/** Evenly spread points over the sphere, kept only on land. */
export function landDots(count: number): Array<{ lonLat: LonLat; turkey: boolean }> {
  const dots: Array<{ lonLat: LonLat; turkey: boolean }> = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const lat = Math.asin(y) / DEG;
    const lon = ((((i * golden) / DEG) % 360) + 360) % 360 - 180;
    if (isLand(lon, lat)) dots.push({ lonLat: [lon, lat], turkey: isTurkey(lon, lat) });
  }
  return dots;
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / len, v[1] / len, v[2] / len];
}

/** Great-circle path between two points, lifted off the surface in an arch. */
export function arcPoints(from: LonLat, to: LonLat, segments = 64): Vec3[] {
  const a = lonLatToVec3(from);
  const b = lonLatToVec3(to);
  const angle = Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
  const lift = 0.06 + 0.3 * (angle / Math.PI);
  const points: Vec3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const sa = Math.sin((1 - t) * angle) / Math.sin(angle);
    const sb = Math.sin(t * angle) / Math.sin(angle);
    const p = normalize([a[0] * sa + b[0] * sb, a[1] * sa + b[1] * sb, a[2] * sa + b[2] * sb]);
    const r = 1 + lift * Math.sin(Math.PI * t);
    points.push([p[0] * r, p[1] * r, p[2] * r]);
  }
  return points;
}

/**
 * Resting orientation: Türkiye slightly above and left of centre, with
 * Asia's supply routes on the right and the Atlantic routes on the left.
 */
export const VIEW = (() => {
  const [x, , z] = lonLatToVec3(ISTANBUL);
  return {
    rotY: Math.atan2(-x, z) - 0.32,
    rotX: (ISTANBUL[1] - 14) * DEG,
    cameraZ: 4.6,
    fov: 30,
  };
})();

/** Applies the group rotation (Euler XYZ: Y first, then X) to a point. */
export function rotate([x, y, z]: Vec3, rotX: number, rotY: number): Vec3 {
  const cy = Math.cos(rotY);
  const sy = Math.sin(rotY);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cx = Math.cos(rotX);
  const sx = Math.sin(rotX);
  return [x1, y * cx - z1 * sx, y * sx + z1 * cx];
}

/** True when the unit sphere does not hide `p` from the camera. */
export function visibleFromCamera([x, y, z]: Vec3): boolean {
  const d = VIEW.cameraZ;
  // Ray C + s(P - C), C = (0, 0, d); occluded if it enters the sphere before s = 1.
  const dx = x;
  const dy = y;
  const dz = z - d;
  const a = dx * dx + dy * dy + dz * dz;
  const b = 2 * d * dz;
  const c = d * d - 1;
  const disc = b * b - 4 * a * c;
  if (disc <= 0) return true;
  const s = (-b - Math.sqrt(disc)) / (2 * a);
  return !(s > 0 && s < 0.999);
}

/** Perspective projection matching the canvas camera, in [-1, 1] units. */
export function project([x, y, z]: Vec3): { x: number; y: number; facing: number } {
  const t = Math.tan((VIEW.fov / 2) * DEG);
  const depth = VIEW.cameraZ - z;
  return { x: x / (depth * t), y: y / (depth * t), facing: z / Math.hypot(x, y, z) };
}
