"use client";

import { useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useSceneState } from "@/components/three/scene-3d";
import { applyRoomEnvironment, watchContext } from "@/components/three/environment";

/**
 * "What's included" as six glossy objects on a turntable. The item the
 * visitor is reading turns to the front, lifts and spins; tapping an
 * object selects its item.
 */

const RADIUS = 1.55;

/** Logo materials: brushed silver (the E), champagne gold (the plus), graphite steel. */
const MATERIAL = {
  silver: { color: "#d6d0cb", roughness: 0.3, metalness: 0.7, clearcoat: 1, clearcoatRoughness: 0.14 },
  steel: { color: "#8f8a85", roughness: 0.34, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.16 },
  gold: { color: "#d8b06f", roughness: 0.24, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.1 },
  kraft: { color: "#c99a62", roughness: 0.75, clearcoat: 0.2 },
  tape: { color: "#8f6638", roughness: 0.5 },
  paper: { color: "#f2efe9", roughness: 0.3, clearcoat: 1 },
  dark: { color: "#18181b", roughness: 0.4, clearcoat: 1 },
} as const;

type Look = keyof typeof MATERIAL;

function Mat({ look }: { look: Look }) {
  return <meshPhysicalMaterial {...MATERIAL[look]} />;
}

/** Chat bubble: rounded body, a tail pointing down-left and three typing dots. */
function Mentor() {
  return (
    <group>
      <RoundedBox args={[0.82, 0.56, 0.24]} radius={0.11} smoothness={4}>
        <Mat look="silver" />
      </RoundedBox>
      <mesh position={[-0.24, -0.34, 0]} rotation={[0, 0, Math.PI - 0.5]}>
        <coneGeometry args={[0.085, 0.2, 18]} />
        <Mat look="silver" />
      </mesh>
      {[-0.2, 0, 0.2].map((x) => (
        <mesh key={x} position={[x, 0, 0.125]}>
          <sphereGeometry args={[0.055, 20, 20]} />
          <Mat look="dark" />
        </mesh>
      ))}
    </group>
  );
}

function Research() {
  return (
    <group rotation={[0, 0, -0.5]}>
      <mesh>
        <torusGeometry args={[0.3, 0.065, 20, 48]} />
        <Mat look="gold" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.29, 0.29, 0.03, 40]} />
        <meshPhysicalMaterial color="#e8e4dc" transparent opacity={0.3} roughness={0} clearcoat={1} />
      </mesh>
      <mesh position={[0, -0.58, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.5, 20]} />
        <Mat look="dark" />
      </mesh>
    </group>
  );
}

function Store() {
  return (
    <group>
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[0.66, 0.66, 0.34]} />
        <Mat look="steel" />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <torusGeometry args={[0.17, 0.035, 14, 32, Math.PI]} />
        <Mat look="gold" />
      </mesh>
      <mesh position={[0, -0.02, 0.175]}>
        <circleGeometry args={[0.1, 32]} />
        <Mat look="paper" />
      </mesh>
    </group>
  );
}

function Ads() {
  return (
    <group rotation={[0, 0, 0.18]}>
      <mesh rotation={[0, 0, -Math.PI / 2]} position={[0.08, 0, 0]}>
        <coneGeometry args={[0.36, 0.72, 36, 1, true]} />
        <meshPhysicalMaterial {...MATERIAL.gold} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.36, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.2, 24]} />
        <Mat look="paper" />
      </mesh>
      <mesh position={[-0.2, -0.24, 0]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.09, 0.3, 0.09]} />
        <Mat look="dark" />
      </mesh>
    </group>
  );
}

function Supply() {
  return (
    <group rotation={[0.08, -0.45, 0]}>
      <mesh>
        <boxGeometry args={[0.74, 0.52, 0.6]} />
        <Mat look="kraft" />
      </mesh>
      <mesh>
        <boxGeometry args={[0.16, 0.525, 0.61]} />
        <Mat look="tape" />
      </mesh>
      <mesh position={[0.22, 0.05, 0.302]}>
        <planeGeometry args={[0.2, 0.14]} />
        <Mat look="paper" />
      </mesh>
    </group>
  );
}

function Community() {
  const person = (x: number, scale: number, look: Look) => (
    <group position={[x, (scale - 1) * 0.3, 0]} scale={scale}>
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.14, 28, 28]} />
        <Mat look={look} />
      </mesh>
      <mesh position={[0, -0.16, 0]}>
        <capsuleGeometry args={[0.15, 0.2, 8, 20]} />
        <Mat look={look} />
      </mesh>
    </group>
  );
  return (
    <group position={[0, -0.05, 0]}>
      {person(-0.33, 0.86, "silver")}
      {person(0.33, 0.86, "steel")}
      <group position={[0, 0, 0.12]}>{person(0, 1.08, "gold")}</group>
    </group>
  );
}

const OBJECTS: Record<string, () => ReactNode> = {
  mentor: Mentor,
  research: Research,
  store: Store,
  ads: Ads,
  supply: Supply,
  community: Community,
};

export default function ShelfCanvas({
  ids,
  active,
  onSelect,
}: {
  ids: readonly string[];
  active: number;
  onSelect: (index: number) => void;
}) {
  const { active: running, ready, fail } = useSceneState();
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 1.5));
  return (
    <Canvas
      frameloop={running ? "always" : "never"}
      dpr={dpr}
      camera={{ position: [0, 2, 6.6], fov: 34, near: 0.1, far: 30 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl, scene, camera }) => {
        watchContext(gl, fail);
        applyRoomEnvironment(gl, scene, 0.65);
        camera.lookAt(0, 0.15, 0);
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 4]} intensity={1.8} />
      <directionalLight position={[-4, 2, -3]} intensity={1.2} color="#d8b06f" />
      {/* Warm key on the front slot, where the active object stands. */}
      <pointLight position={[0, 1.4, 3]} intensity={5} distance={4.5} decay={2} color="#ffe7bf" />
      <Turntable ids={ids} active={active} onSelect={onSelect} onReady={ready} />
    </Canvas>
  );
}

function Turntable({
  ids,
  active,
  onSelect,
  onReady,
}: {
  ids: readonly string[];
  active: number;
  onSelect: (index: number) => void;
  onReady: () => void;
}) {
  const table = useRef<THREE.Group>(null);
  const items = useRef<Array<THREE.Group | null>>([]);
  const frames = useRef(0);
  const n = ids.length;
  const step = (Math.PI * 2) / n;

  useFrame((state, delta) => {
    frames.current += 1;
    if (frames.current === 3) onReady();
    const t = state.clock.elapsedTime;
    const g = table.current;
    if (g) {
      // Shortest turn to bring the active object to the front (+z).
      const goal = -active * step;
      let diff = (goal - g.rotation.y) % (Math.PI * 2);
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      g.rotation.y += diff * Math.min(1, delta * 3.2);
    }
    items.current.forEach((item, i) => {
      if (!item) return;
      const isActive = i === active;
      const scale = THREE.MathUtils.lerp(item.scale.x, isActive ? 1 : 0.7, Math.min(1, delta * 4));
      item.scale.setScalar(scale);
      item.position.y = THREE.MathUtils.lerp(
        item.position.y,
        (isActive ? 0.36 : 0.12) + Math.sin(t * 1.4 + i) * 0.04,
        Math.min(1, delta * 4),
      );
      // The active object sways to show its depth but keeps its face to the
      // viewer (a full spin turns flat ones, like the chat bubble, edge-on).
      const inner = item.children[0];
      if (inner) {
        const goal = isActive ? Math.sin(t * 1.1) * 0.55 : 0;
        inner.rotation.y = THREE.MathUtils.lerp(inner.rotation.y, goal, Math.min(1, delta * 3));
      }
    });
  });

  return (
    <group>
      <group ref={table}>
        {ids.map((id, i) => {
          const Model = OBJECTS[id] ?? Supply;
          const angle = i * step;
          return (
            <group
              key={id}
              ref={(item) => {
                items.current[i] = item;
              }}
              position={[Math.sin(angle) * RADIUS, 0.2, Math.cos(angle) * RADIUS]}
              rotation={[0, angle, 0]}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(i);
              }}
            >
              <group>
                <Model />
              </group>
            </group>
          );
        })}
      </group>
      {/* Matte, barely reflective disc: a glossy one mirrors the bright studio environment as grey. */}
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[RADIUS + 0.55, RADIUS + 0.62, 0.1, 96]} />
        <meshStandardMaterial color="#111114" roughness={0.75} metalness={0} envMapIntensity={0.15} />
      </mesh>
      <mesh position={[0, -0.368, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RADIUS + 0.55, 0.01, 8, 160]} />
        <meshBasicMaterial color="#a9823f" />
      </mesh>
    </group>
  );
}
