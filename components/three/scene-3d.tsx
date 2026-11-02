"use client";

import {
  Component,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const noopSubscribe = () => () => {};

/**
 * Mount point for one WebGL scene.
 * - Renders the static fallback first (SSR, no JS, reduced motion, weak
 *   devices, no WebGL) — the page is complete without 3D.
 * - Loads the canvas only when the slot comes near the viewport, and
 *   pauses rendering whenever it is off-screen.
 * Each section owns its canvas (in normal flow) instead of one fixed,
 * page-wide canvas: fixed canvases jitter during native touch scrolling and
 * resize on every toolbar change in Instagram's in-app browser.
 */

let capability: boolean | null = null;

export function canRender3D(): boolean {
  if (capability !== null) return capability;
  try {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return (capability = false);
    if (nav.connection?.saveData) return (capability = false);
    if ((nav.deviceMemory ?? 8) < 3 || (nav.hardwareConcurrency ?? 8) < 4) return (capability = false);
    const canvas = document.createElement("canvas");
    capability = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    capability = false;
  }
  return capability;
}

type SceneState = { active: boolean; ready: () => void; fail: () => void };
const SceneContext = createContext<SceneState>({ active: false, ready: () => {}, fail: () => {} });

/**
 * For canvases: `active` drives the frameloop, call `ready()` once the first
 * frames rendered and `fail()` if the WebGL context is lost.
 */
export function useSceneState(): SceneState {
  return useContext(SceneContext);
}

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("[3d] scene disabled:", error);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function Scene3D({
  children,
  fallback,
  className = "relative",
  rootMargin = "60% 0px",
}: {
  children: ReactNode;
  fallback: ReactNode;
  /** Must position the slot (`relative`, `absolute`…): the layers inside are absolute. */
  className?: string;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useSyncExternalStore(noopSubscribe, canRender3D, () => false);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const nearObserver = new IntersectionObserver(([entry]) => entry.isIntersecting && setNear(true), { rootMargin });
    const visibleObserver = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "10% 0px",
    });
    nearObserver.observe(el);
    visibleObserver.observe(el);
    const onVisibility = () => setVisible((v) => (document.hidden ? false : v));
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      nearObserver.disconnect();
      visibleObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, rootMargin]);

  const live = enabled && near && !failed;
  const state = useMemo<SceneState>(
    () => ({
      active: visible,
      ready: () => setReady(true),
      fail: () => {
        setReady(false);
        setFailed(true);
      },
    }),
    [visible],
  );

  return (
    <div ref={ref} className={className}>
      <div
        aria-hidden={ready ? true : undefined}
        style={{
          position: "absolute",
          inset: 0,
          transition: "opacity 700ms ease",
          opacity: ready ? 0 : 1,
          pointerEvents: ready ? "none" : undefined,
        }}
      >
        {fallback}
      </div>
      {live && (
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, transition: "opacity 900ms ease", opacity: ready ? 1 : 0 }}
        >
          <SceneBoundary onError={state.fail}>
            <SceneContext.Provider value={state}>{children}</SceneContext.Provider>
          </SceneBoundary>
        </div>
      )}
    </div>
  );
}
