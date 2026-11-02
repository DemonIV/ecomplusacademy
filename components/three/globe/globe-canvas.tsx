"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { useSceneState } from "@/components/three/scene-3d";
import { arcPoints, ISTANBUL, landDots, lonLatToVec3, ROUTES, VIEW } from "@/components/three/globe/geo";

/**
 * Hero globe: dotted continents, Türkiye in gold, supply routes flowing in
 * from Asia and order routes flowing out to Europe, the Gulf and North
 * America, with kraft parcels travelling each arc.
 */

/** Logo palette: graphite sphere, silver continents and halo, champagne gold for Türkiye. */
const COLOR = {
  body: new THREE.Color("#111114"),
  rim: new THREE.Color("#d6d0cb"),
  dot: new THREE.Color("#d6d0cb"),
  dotFar: new THREE.Color("#4a4743"),
  gold: new THREE.Color("#d8b06f"),
  halo: new THREE.Color("#8f8a85"),
  silver: new THREE.Color("#d6d0cb"),
  paper: new THREE.Color("#f2efe9"),
};

const hash = (i: number) => {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Every arc finishes drawing by this time (s); parcels start after it.
const REVEAL_SECONDS = 1.8;

const ROUTE_DATA = ROUTES.map((route, i) => {
  const from = route.kind === "supply" ? route.at : ISTANBUL;
  const to = route.kind === "supply" ? ISTANBUL : route.at;
  const curve = new THREE.CatmullRomCurve3(arcPoints(from, to, 64).map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  return {
    ...route,
    curve,
    speed: 0.11 + hash(i + 3) * 0.06,
    offset: hash(i + 11),
    delay: 0.15 + i * 0.12,
    end: new THREE.Vector3(...lonLatToVec3(route.at, 1.004)),
  };
});

export default function GlobeCanvas() {
  const { active, ready, fail } = useSceneState();
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 1.5));

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={dpr}
      camera={{ position: [0, 0, VIEW.cameraZ], fov: VIEW.fov, near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          fail();
        });
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[-3, 4, 5]} intensity={2.4} />
      <Globe onReady={ready} />
    </Canvas>
  );
}

function Globe({ onReady }: { onReady: () => void }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const frames = useRef(0);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    frames.current += 1;
    if (frames.current === 3) onReady();
    // Starts exactly at the fallback's framing (sin 0 = 0), then sways.
    const t = state.clock.elapsedTime;
    const targetY = VIEW.rotY + Math.sin(t * 0.11) * 0.42 + pointer.current.x * 0.12;
    const targetX = VIEW.rotX + pointer.current.y * 0.06;
    const ease = Math.min(1, delta * 2.5);
    g.rotation.y += (targetY - g.rotation.y) * ease;
    g.rotation.x += (targetX - g.rotation.x) * ease;
  });

  return (
    <group ref={group} rotation={[VIEW.rotX, VIEW.rotY, 0]}>
      <Body />
      <Dots />
      <Atmosphere />
      {ROUTE_DATA.map((route, i) => (
        <Route key={route.city} index={i} />
      ))}
      <Parcels />
      <Pulses />
    </group>
  );
}

const NORMAL_VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

/** Opaque dark sphere: hides the far side and gives the globe volume. */
function Body() {
  const uniforms = useMemo(() => ({ uBase: { value: COLOR.body }, uRim: { value: COLOR.rim } }), []);
  return (
    <mesh renderOrder={0}>
      <sphereGeometry args={[1, 72, 72]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={NORMAL_VERTEX}
        fragmentShader={/* glsl */ `
          uniform vec3 uBase;
          uniform vec3 uRim;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            float facing = max(dot(vNormal, vView), 0.0);
            float light = max(dot(vNormal, normalize(vec3(-0.55, 0.6, 0.6))), 0.0);
            vec3 color = uBase * (0.45 + 0.6 * light) + uRim * pow(1.0 - facing, 4.0) * 0.3;
            gl_FragColor = vec4(color, 1.0);
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  );
}

function Atmosphere() {
  const uniforms = useMemo(() => ({ uColor: { value: COLOR.halo } }), []);
  return (
    <mesh renderOrder={1} scale={1.17}>
      <sphereGeometry args={[1, 48, 48]} />
      <shaderMaterial
        uniforms={uniforms}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
        vertexShader={NORMAL_VERTEX}
        fragmentShader={/* glsl */ `
          uniform vec3 uColor;
          varying vec3 vNormal;
          void main() {
            // Back faces: 0 at the halo's outer edge, ~0.5 where it meets the
            // globe, so the glow hugs the globe and fades out to nothing.
            float depth = max(0.0, -dot(vNormal, vec3(0.0, 0.0, 1.0)));
            float intensity = pow(min(depth / 0.52, 1.0), 2.6);
            gl_FragColor = vec4(uColor * intensity * 0.85, 1.0);
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  );
}

function Dots() {
  const material = useRef<THREE.ShaderMaterial>(null);
  const height = useThree((s) => s.size.height);
  const pixelRatio = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const dots = landDots(12000);
    const positions = new Float32Array(dots.length * 3);
    const seeds = new Float32Array(dots.length);
    const turkey = new Float32Array(dots.length);
    dots.forEach((dot, i) => {
      positions.set(lonLatToVec3(dot.lonLat, 1.003), i * 3);
      seeds[i] = hash(i);
      turkey[i] = dot.turkey ? 1 : 0;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aTurkey", new THREE.BufferAttribute(turkey, 1));
    return g;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 1 },
      uNear: { value: COLOR.dot },
      uFar: { value: COLOR.dotFar },
      uGold: { value: COLOR.gold },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const m = material.current;
    if (!m) return;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    // ~3.4 css px dots at a 600 px tall canvas, scaled with the canvas.
    m.uniforms.uSize.value = 13.5 * (height / 600) * pixelRatio;
  });

  return (
    <points geometry={geometry} renderOrder={2}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexShader={/* glsl */ `
          uniform float uSize;
          attribute float aSeed;
          attribute float aTurkey;
          varying float vFacing;
          varying float vSeed;
          varying float vTurkey;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vFacing = dot(normalize(normalMatrix * position), normalize(-mv.xyz));
            vSeed = aSeed;
            vTurkey = aTurkey;
            gl_PointSize = uSize * (1.0 + aTurkey * 0.2) / -mv.z;
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uTime;
          uniform vec3 uNear;
          uniform vec3 uFar;
          uniform vec3 uGold;
          varying float vFacing;
          varying float vSeed;
          varying float vTurkey;
          void main() {
            float r = length(gl_PointCoord - 0.5);
            if (r > 0.5) discard;
            float edge = smoothstep(0.5, 0.32, r);
            float facing = smoothstep(0.0, 0.7, vFacing);
            vec3 color = mix(uFar, uNear, facing);
            float twinkle = step(0.992, vSeed) * (0.5 + 0.5 * sin(uTime * 2.2 + vSeed * 40.0));
            color = mix(color, vec3(1.0), twinkle * 0.6);
            color = mix(color, uGold, vTurkey);
            gl_FragColor = vec4(color, edge * mix(0.35, 0.95, facing));
            #include <colorspace_fragment>
          }
        `}
      />
    </points>
  );
}

function Route({ index }: { index: number }) {
  const route = ROUTE_DATA[index];
  const material = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => new THREE.TubeGeometry(route.curve, 96, 0.0042, 6, false), [route]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uSpeed: { value: route.speed },
      uOffset: { value: route.offset },
      uFrom: { value: route.kind === "supply" ? COLOR.silver : COLOR.gold },
      uTo: { value: route.kind === "supply" ? COLOR.gold : COLOR.paper },
    }),
    [route],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const m = material.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    m.uniforms.uTime.value = t;
    m.uniforms.uReveal.value = smooth(route.delay, route.delay + 1.1, t) * 1.06;
  });

  return (
    <mesh geometry={geometry} renderOrder={3}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          varying float vU;
          void main() {
            vU = uv.x;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uTime;
          uniform float uReveal;
          uniform float uSpeed;
          uniform float uOffset;
          uniform vec3 uFrom;
          uniform vec3 uTo;
          varying float vU;
          void main() {
            float head = fract(max(uTime - ${REVEAL_SECONDS.toFixed(1)}, 0.0) * uSpeed + uOffset);
            float behind = head - vU;
            float trail = behind >= 0.0 ? exp(-behind * 9.0) : 0.0;
            float ends = smoothstep(0.0, 0.05, vU) * smoothstep(1.0, 0.95, vU);
            float drawn = 1.0 - smoothstep(uReveal - 0.05, uReveal, vU);
            float running = step(1.0, uReveal);
            float alpha = (0.22 + trail * 0.95 * running) * ends * drawn;
            vec3 color = mix(uFrom, uTo, vU) * (0.75 + trail * 1.3 * running);
            gl_FragColor = vec4(color * alpha, alpha);
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  );
}

const tmpObject = new THREE.Object3D();
const tmpTarget = new THREE.Vector3();
const tmpPoint = new THREE.Vector3();
const tmpTangent = new THREE.Vector3();

/** Kraft boxes with a darker tape strip, one per route, riding the arc heads. */
function Parcels() {
  const boxes = useRef<THREE.InstancedMesh>(null);
  const tape = useRef<THREE.InstancedMesh>(null);

  useFrame((state) => {
    const b = boxes.current;
    const s = tape.current;
    if (!b || !s) return;
    const t = state.clock.elapsedTime;
    const running = Math.max(t - REVEAL_SECONDS, 0);
    const appear = smooth(REVEAL_SECONDS - 0.2, REVEAL_SECONDS + 0.4, t);
    ROUTE_DATA.forEach((route, i) => {
      const p = (running * route.speed + route.offset) % 1;
      route.curve.getPointAt(p, tmpPoint);
      route.curve.getTangentAt(p, tmpTangent);
      const scale = 0.042 * smooth(0, 0.06, p) * smooth(1, 0.94, p) * appear;
      tmpObject.position.copy(tmpPoint);
      tmpObject.up.copy(tmpPoint).normalize();
      tmpObject.lookAt(tmpTarget.copy(tmpPoint).add(tmpTangent));
      tmpObject.scale.setScalar(Math.max(scale, 0.0001));
      tmpObject.updateMatrix();
      b.setMatrixAt(i, tmpObject.matrix);
      s.setMatrixAt(i, tmpObject.matrix);
    });
    b.instanceMatrix.needsUpdate = true;
    s.instanceMatrix.needsUpdate = true;
  });

  return (
    <group renderOrder={4}>
      <instancedMesh ref={boxes} args={[undefined, undefined, ROUTE_DATA.length]} frustumCulled={false}>
        <boxGeometry args={[1, 0.72, 1.3]} />
        <meshStandardMaterial color="#c99a62" roughness={0.82} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={tape} args={[undefined, undefined, ROUTE_DATA.length]} frustumCulled={false}>
        <boxGeometry args={[0.24, 0.735, 1.315]} />
        <meshStandardMaterial color="#8f6638" roughness={0.6} metalness={0} />
      </instancedMesh>
    </group>
  );
}

/** Rings that ping where a parcel lands, plus a steady pulse on İstanbul. */
function Pulses() {
  const rings = useRef<Array<THREE.Mesh | null>>([]);
  const home = useRef<THREE.Mesh>(null);
  const homePosition = useMemo(() => new THREE.Vector3(...lonLatToVec3(ISTANBUL, 1.005)), []);
  const orient = (mesh: THREE.Mesh | null, at: THREE.Vector3) => {
    if (!mesh) return;
    mesh.position.copy(at);
    mesh.lookAt(tmpTarget.copy(at).multiplyScalar(2));
  };

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const running = Math.max(t - REVEAL_SECONDS, 0);
    ROUTE_DATA.forEach((route, i) => {
      const mesh = rings.current[i];
      if (!mesh || route.kind !== "sale") return;
      const p = (running * route.speed + route.offset) % 1;
      // Time since the last arrival, as a fraction of the trip.
      const since = running > 0 ? p / 0.22 : 1;
      const visible = since < 1 && running * route.speed + route.offset >= 1;
      mesh.visible = visible;
      if (visible) {
        mesh.scale.setScalar(0.6 + since * 2.4);
        (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - since) * 0.9;
      }
    });
    const h = home.current;
    if (h) {
      const k = (t % 2.4) / 2.4;
      h.scale.setScalar(0.8 + k * 2.6);
      (h.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.85;
    }
  });

  return (
    <group renderOrder={5}>
      {ROUTE_DATA.map((route, i) =>
        route.kind === "sale" ? (
          <mesh
            key={route.city}
            ref={(mesh) => {
              rings.current[i] = mesh;
              orient(mesh, route.end);
            }}
            visible={false}
          >
            <ringGeometry args={[0.014, 0.019, 40]} />
            <meshBasicMaterial color="#f2efe9" transparent depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ) : null,
      )}
      <mesh
        ref={(mesh) => {
          home.current = mesh;
          orient(mesh, homePosition);
        }}
      >
        <ringGeometry args={[0.016, 0.022, 48]} />
        <meshBasicMaterial color="#d8b06f" transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={homePosition}>
        <sphereGeometry args={[0.014, 16, 16]} />
        <meshBasicMaterial color="#e2bf84" />
      </mesh>
    </group>
  );
}
