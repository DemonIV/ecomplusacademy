"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Scene3D } from "@/components/three/scene-3d";

const GlobeCanvas = dynamic(() => import("@/components/three/globe/globe-canvas"), { ssr: false });

/**
 * `fallback` is the server-rendered SVG globe with the same framing: the
 * first paint, and the final picture until the 3D scene takes over after the
 * visitor's first input (or a few seconds after load).
 */
export function HeroGlobe({ fallback, className }: { fallback: ReactNode; className?: string }) {
  return (
    <Scene3D fallback={fallback} className={className} rootMargin="0px" deferStart>
      <GlobeCanvas />
    </Scene3D>
  );
}
