"use client";

import { useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { useSceneState } from "@/components/three/scene-3d";

/**
 * The founder's timeline as a road climbing through space: the scroll
 * position fills it with gold, each milestone node lights up when reached,
 * and the camera follows the travelling light.
 */

const ROAD = new THREE.CatmullRomCurve3(
  [
    [-1.9, -1.35, 0.4],
    [-1.05, -1.05, -0.35],
    [-0.35, -0.45, 0.35],
    [0.25, -0.05, -0.4],
    [0.95, 0.55, 0.25],
    [1.55, 1.05, -0.2],
    [2.05, 1.6, 0.3],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false,
  "centripetal",
);

const GOLD = new THREE.Color("#d8b06f");
const SILVER = new THREE.Color("#d6d0cb");
// The road ahead stays readable on the night background before it fills.
const DIM = new THREE.Color("#3a3833");

export default function FounderCanvas({ progress, milestones }: { progress: RefObject<number>; milestones: number }) {
  const { active, ready, fail } = useSceneState();
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 1.5));
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={dpr}
      camera={{ position: [-1.2, -0.6, 4.2], fov: 38, near: 0.1, far: 30 }}
      gl={{ antialias: true, alpha: true }}
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
      <ambientLight intensity={0.5} />
      <Road progress={progress} milestones={milestones} onReady={ready} />
      <Ground />
    </Canvas>
  );
}

function Road({
  progress,
  milestones,
  onReady,
}: {
  progress: RefObject<number>;
  milestones: number;
  onReady: () => void;
}) {
  const shown = useRef(0);
  const frames = useRef(0);
  const road = useRef<THREE.ShaderMaterial>(null);
  const traveler = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const nodes = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const halos = useRef<Array<THREE.Mesh | null>>([]);
  const lookAt = useRef(new THREE.Vector3());
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const camGoal = useMemo(() => new THREE.Vector3(), []);

  const geometry = useMemo(() => new THREE.TubeGeometry(ROAD, 220, 0.034, 10, false), []);
  const nodePositions = useMemo(
    () => Array.from({ length: milestones }, (_, i) => ROAD.getPointAt(i / Math.max(1, milestones - 1))),
    [milestones],
  );
  const uniforms = useMemo(
    () => ({ uProgress: { value: 0 }, uGold: { value: GOLD }, uDim: { value: DIM }, uTime: { value: 0 } }),
    [],
  );

  useFrame((state, delta) => {
    frames.current += 1;
    if (frames.current === 3) onReady();
    const target = progress.current ?? 0;
    shown.current += (target - shown.current) * Math.min(1, delta * 3.2);
    const p = Math.min(0.9999, Math.max(0.0001, shown.current));

    if (road.current) {
      road.current.uniforms.uProgress.value = p;
      road.current.uniforms.uTime.value = state.clock.elapsedTime;
    }

    const head = ROAD.getPointAt(p, tmp);
    traveler.current?.position.copy(head);
    light.current?.position.copy(head);

    nodePositions.forEach((_, i) => {
      const reached = p >= i / Math.max(1, milestones - 1) - 0.004;
      const material = nodes.current[i];
      if (material) {
        material.emissiveIntensity += ((reached ? 1.6 : 0.12) - material.emissiveIntensity) * Math.min(1, delta * 5);
      }
      const halo = halos.current[i];
      if (halo) {
        const goal = reached ? 1 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.08 : 0.0001;
        halo.scale.setScalar(THREE.MathUtils.lerp(halo.scale.x, goal, Math.min(1, delta * 4)));
      }
    });

    // Camera follows the head, slightly behind and above, with a slow sway.
    // The tall desktop column sees less sideways, so it stands further back.
    const cam = state.camera;
    const sway = Math.sin(state.clock.elapsedTime * 0.25) * 0.25;
    const distance = THREE.MathUtils.clamp(4.2 / (state.size.width / Math.max(1, state.size.height)), 3.6, 6);
    cam.position.lerp(camGoal.set(head.x - 1.1 + sway, head.y + 0.35, head.z + distance), Math.min(1, delta * 1.8));
    lookAt.current.lerp(head, Math.min(1, delta * 2.4));
    cam.lookAt(lookAt.current);
  });

  return (
    <group>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={road}
          uniforms={uniforms}
          transparent
          vertexShader={/* glsl */ `
            varying float vU;
            void main() {
              vU = uv.x;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={/* glsl */ `
            uniform float uProgress;
            uniform float uTime;
            uniform vec3 uGold;
            uniform vec3 uDim;
            varying float vU;
            void main() {
              float filled = 1.0 - smoothstep(uProgress - 0.004, uProgress + 0.004, vU);
              float glow = exp(-abs(uProgress - vU) * 40.0);
              float flow = 0.85 + 0.15 * sin(vU * 90.0 - uTime * 4.0);
              vec3 color = mix(uDim, uGold * flow, filled) + uGold * glow * 0.9;
              float alpha = mix(0.85, 1.0, filled);
              gl_FragColor = vec4(color, alpha);
              #include <colorspace_fragment>
            }
          `}
        />
      </mesh>

      {nodePositions.map((position, i) => (
        <group key={i} position={position}>
          <mesh>
            <sphereGeometry args={[0.085, 32, 32]} />
            <meshStandardMaterial
              ref={(material) => {
                nodes.current[i] = material;
              }}
              color="#2a2927"
              emissive={GOLD}
              emissiveIntensity={0.12}
              roughness={0.35}
              metalness={0.2}
            />
          </mesh>
          <mesh
            ref={(mesh) => {
              halos.current[i] = mesh;
            }}
            scale={0.0001}
          >
            <ringGeometry args={[0.13, 0.15, 48]} />
            <meshBasicMaterial color={GOLD} transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      ))}

      <group ref={traveler}>
        <mesh>
          <sphereGeometry args={[0.05, 24, 24]} />
          <meshBasicMaterial color="#fbf1dc" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshBasicMaterial color={GOLD} transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      <pointLight ref={light} color={GOLD} intensity={6} distance={2.6} decay={2} />
    </group>
  );
}

/** Receding dot grid under the road for depth. */
function Ground() {
  const geometry = useMemo(() => {
    const points: number[] = [];
    for (let x = -6; x <= 6; x += 0.32) {
      for (let z = -6; z <= 2.5; z += 0.32) points.push(x, -1.9, z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return g;
  }, []);
  return (
    <points geometry={geometry}>
      <pointsMaterial color={SILVER} size={0.022} sizeAttenuation transparent opacity={0.22} depthWrite={false} />
    </points>
  );
}
