"use client";

import { useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { useSceneState } from "@/components/three/scene-3d";
import { applyRoomEnvironment, watchContext } from "@/components/three/environment";

/**
 * Monthly revenue as glossy 3D columns that grow when the chart first
 * comes into view. Labels are plain DOM in one overlay above the canvas,
 * moved every frame from projected bar positions: text stays crisp, and no
 * extra React roots are created inside the WebGL tree.
 */

const SPACING = 0.52;
const WIDTH = 0.34;
const MAX_HEIGHT = 2.5;
const GROW_SECONDS = 1.3;

const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

export default function RevenueCanvas({ months, values }: { months: readonly string[]; values: readonly number[] }) {
  const { active, ready, fail } = useSceneState();
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 1.5));
  const [hovered, setHovered] = useState<number | null>(null);
  const monthLabels = useRef<Array<HTMLSpanElement | null>>([]);
  const valueLabel = useRef<HTMLSpanElement>(null);
  const focus = hovered ?? values.length - 1;
  const isLast = focus === values.length - 1;

  return (
    <div className="relative size-full">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={dpr}
        camera={{ position: [-1.6, 2.1, 7.4], fov: 34, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl, scene, camera }) => {
          watchContext(gl, fail);
          applyRoomEnvironment(gl, scene, 0.7);
          camera.lookAt(0, 1.05, 0);
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[-4, 6, 5]} intensity={1.6} />
        <Bars
          values={values}
          hovered={hovered}
          focus={focus}
          onHover={setHovered}
          monthsRef={monthLabels}
          valueRef={valueLabel}
          onReady={ready}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
        {months.map((month, i) => (
          <span
            key={month}
            ref={(el) => {
              monthLabels.current[i] = el;
            }}
            className="absolute top-0 left-0 text-[11px] font-semibold whitespace-nowrap text-faint opacity-0"
          >
            {month}
          </span>
        ))}
        <span
          ref={valueLabel}
          className={`absolute top-0 left-0 rounded-md px-1.5 py-0.5 text-[12px] font-bold whitespace-nowrap opacity-0 ${
            isLast ? "bg-gold text-[#1d1404]" : "bg-panel-2 text-paper"
          }`}
        >
          {values[focus]} bin
        </span>
      </div>
    </div>
  );
}

function Bars({
  values,
  hovered,
  focus,
  onHover,
  monthsRef,
  valueRef,
  onReady,
}: {
  values: readonly number[];
  hovered: number | null;
  focus: number;
  onHover: (index: number | null | ((current: number | null) => number | null)) => void;
  // Overlay labels moved by the frame loop; the `Ref` suffix tells the React Compiler they are refs.
  monthsRef: RefObject<Array<HTMLSpanElement | null>>;
  valueRef: RefObject<HTMLSpanElement | null>;
  onReady: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<Array<THREE.Mesh | null>>([]);
  const heights = useRef<number[]>(values.map(() => 0));
  const start = useRef<number | null>(null);
  const frames = useRef(0);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const max = Math.max(...values);
  const last = values.length - 1;
  const x0 = (-(values.length - 1) * SPACING) / 2;

  const geometry = useMemo(() => {
    // Unit-height box with its base at y = 0, so scaling y grows it upwards.
    const g = new THREE.BoxGeometry(WIDTH, 1, WIDTH);
    g.translate(0, 0.5, 0);
    return g;
  }, []);

  useFrame((state) => {
    frames.current += 1;
    if (frames.current === 3) onReady();
    start.current ??= state.clock.elapsedTime;
    const t = state.clock.elapsedTime - start.current;
    values.forEach((value, i) => {
      const height = (value / max) * MAX_HEIGHT * easeOut((t - i * 0.07) / GROW_SECONDS);
      heights.current[i] = height;
      const mesh = meshes.current[i];
      if (mesh) mesh.scale.y = Math.max(height, 0.001);
    });
    const g = group.current;
    if (!g) return;
    g.rotation.y = -0.18 + Math.sin(state.clock.elapsedTime * 0.3) * 0.04 + state.pointer.x * 0.05;
    g.updateMatrixWorld();

    // Screen position (CSS px) of a point in the bars' local space.
    const place = (el: HTMLElement | null | undefined, x: number, y: number, z: number, dy = 0) => {
      if (!el) return;
      projected.set(x, y, z).applyMatrix4(g.matrixWorld).project(state.camera);
      const sx = (projected.x * 0.5 + 0.5) * state.size.width;
      const sy = (-projected.y * 0.5 + 0.5) * state.size.height + dy;
      el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -50%)`;
      el.style.opacity = "1";
    };
    monthsRef.current.forEach((el, i) => place(el, x0 + i * SPACING, -0.18, 0.2));
    place(valueRef.current, x0 + focus * SPACING, heights.current[focus] + 0.08, 0, -14);
  });

  return (
    <group ref={group}>
      <gridHelper args={[8, 16, "#2c2b28", "#1a1a1c"]} position={[0, 0, 0]} />
      {values.map((value, i) => {
        const isLast = i === last;
        return (
          <mesh
            key={i}
            ref={(mesh) => {
              meshes.current[i] = mesh;
            }}
            geometry={geometry}
            position={[x0 + i * SPACING, 0, 0]}
            scale={[1, 0.001, 1]}
            onPointerOver={(event) => {
              event.stopPropagation();
              onHover(i);
            }}
            onPointerOut={() => onHover((h) => (h === i ? null : h))}
            onClick={() => onHover(i)}
          >
            <meshPhysicalMaterial
              color={isLast ? "#d8b06f" : hovered === i ? "#d6d0cb" : "#8f8a85"}
              emissive={isLast ? "#5a4320" : "#1b1a18"}
              emissiveIntensity={0.6}
              roughness={0.28}
              metalness={isLast ? 0.45 : 0.35}
              clearcoat={1}
              clearcoatRoughness={0.18}
            />
          </mesh>
        );
      })}
    </group>
  );
}
