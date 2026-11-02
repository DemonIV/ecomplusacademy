"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Scene3D } from "@/components/three/scene-3d";

const GlobeCanvas = dynamic(() => import("@/components/three/globe/globe-canvas"), { ssr: false });

/** `fallback` is the server-rendered SVG globe with the same framing. */
export function HeroGlobe({ fallback, className }: { fallback: ReactNode; className?: string }) {
  return (
    <Scene3D fallback={fallback} className={className} rootMargin="0px">
      <GlobeCanvas />
    </Scene3D>
  );
}
