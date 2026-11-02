import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Procedural studio reflections for glossy (clearcoat) materials — no HDR
 * download. Call from a Canvas `onCreated`.
 */
export function applyRoomEnvironment(gl: THREE.WebGLRenderer, scene: THREE.Scene, intensity = 0.6) {
  const pmrem = new THREE.PMREMGenerator(gl);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = intensity;
  room.dispose();
  pmrem.dispose();
}

/** Shared Canvas `onCreated` wiring: transparent clear and context-loss fallback. */
export function watchContext(gl: THREE.WebGLRenderer, fail: () => void) {
  gl.setClearColor(0x000000, 0);
  gl.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    fail();
  });
}
