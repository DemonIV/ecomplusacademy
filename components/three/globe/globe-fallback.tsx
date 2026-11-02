import {
  arcPoints,
  ISTANBUL,
  landDots,
  lonLatToVec3,
  project,
  rotate,
  ROUTES,
  VIEW,
  visibleFromCamera,
  type Vec3,
} from "@/components/three/globe/geo";

/**
 * The globe as a static SVG, computed at build time with the same camera as
 * the WebGL scene. It is the first paint, the loading state, and the final
 * picture for devices that do not get 3D.
 */

const SIZE = 1000;
const HALF = SIZE / 2;

function toScreen(p: Vec3) {
  const s = project(rotate(p, VIEW.rotX, VIEW.rotY));
  return { x: HALF + s.x * HALF, y: HALF - s.y * HALF, facing: s.facing };
}

const fmt = (n: number) => Math.round(n * 10) / 10;

function buildPaths() {
  const bands = { near: "", mid: "", far: "", turkey: "" };
  for (const dot of landDots(9000)) {
    const world = lonLatToVec3(dot.lonLat);
    const rotated = rotate(world, VIEW.rotX, VIEW.rotY);
    if (!visibleFromCamera(rotated)) continue;
    const { x, y, facing } = toScreen(world);
    const move = `M${fmt(x)} ${fmt(y)}h0`;
    if (dot.turkey) bands.turkey += move;
    else if (facing > 0.62) bands.near += move;
    else if (facing > 0.38) bands.mid += move;
    else bands.far += move;
  }

  const arcs = ROUTES.map((route) => {
    const from = route.kind === "supply" ? route.at : ISTANBUL;
    const to = route.kind === "supply" ? ISTANBUL : route.at;
    let d = "";
    let drawing = false;
    for (const point of arcPoints(from, to, 48)) {
      const visible = visibleFromCamera(rotate(point, VIEW.rotX, VIEW.rotY));
      if (!visible) {
        drawing = false;
        continue;
      }
      const { x, y } = toScreen(point);
      d += `${drawing ? "L" : "M"}${fmt(x)} ${fmt(y)}`;
      drawing = true;
    }
    const end = lonLatToVec3(route.at);
    const endVisible = visibleFromCamera(rotate(end, VIEW.rotX, VIEW.rotY));
    return { d, kind: route.kind, hub: endVisible ? toScreen(end) : null };
  });

  return { bands, arcs, istanbul: toScreen(lonLatToVec3(ISTANBUL)) };
}

const limb = (() => {
  const angle = Math.asin(1 / VIEW.cameraZ);
  return (Math.tan(angle) / Math.tan(((VIEW.fov / 2) * Math.PI) / 180)) * HALF;
})();

export function GlobeFallback() {
  const { bands, arcs, istanbul } = buildPaths();
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="gf-body" cx="42%" cy="36%" r="70%">
          <stop offset="0%" stopColor="#1b1b1f" />
          <stop offset="70%" stopColor="#0f0f11" />
          <stop offset="100%" stopColor="#070708" />
        </radialGradient>
        <radialGradient id="gf-glow" cx="50%" cy="50%" r="50%">
          <stop offset="78%" stopColor="#8f8a85" stopOpacity="0.26" />
          <stop offset="88%" stopColor="#8f8a85" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#8f8a85" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={HALF} cy={HALF} r={limb * 1.24} fill="url(#gf-glow)" />
      <circle cx={HALF} cy={HALF} r={limb} fill="url(#gf-body)" />
      <g fill="none" strokeLinecap="round">
        <path d={bands.far} stroke="#5b5852" strokeOpacity="0.45" strokeWidth="4.2" />
        <path d={bands.mid} stroke="#9c9690" strokeOpacity="0.7" strokeWidth="4.8" />
        <path d={bands.near} stroke="#d6d0cb" strokeOpacity="0.85" strokeWidth="5.2" />
        <path d={bands.turkey} stroke="#d8b06f" strokeWidth="5.6" />
      </g>
      <g fill="none" strokeLinecap="round">
        {arcs.map((arc, i) => (
          <path
            key={i}
            d={arc.d}
            stroke={arc.kind === "supply" ? "#d6d0cb" : "#d8b06f"}
            strokeOpacity="0.75"
            strokeWidth="2.6"
          />
        ))}
      </g>
      {arcs.map((arc, i) =>
        arc.hub ? <circle key={i} cx={arc.hub.x} cy={arc.hub.y} r="6" fill="#f2efe9" fillOpacity="0.9" /> : null,
      )}
      <circle cx={istanbul.x} cy={istanbul.y} r="20" fill="#d8b06f" fillOpacity="0.18" />
      <circle cx={istanbul.x} cy={istanbul.y} r="9" fill="#e2bf84" />
    </svg>
  );
}
