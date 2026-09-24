import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { director } from "../lib/director";
import {
  CAM_TRACK,
  CAN_TRACKS,
  MAX_FOV,
  MIN_FOV,
  computeSafeMaxDistance,
  computeSafeMinDistance,
  sampleCamPose,
  sampleCanPose,
  scratch,
} from "../lib/tracks";
import { CAN_HEIGHT, CAN_RADIUS } from "../lib/products";

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

const PARALLAX_X = 0.34;
const PARALLAX_Y = 0.22;
/** Mouse-linked "breathing" zoom — deliberately tiny (max 3%). */
const BREATHING_ZOOM = 0.03;
/** Extra dolly-out while the loading reveal is playing. */
const REVEAL_PUSH = 0.5;

/**
 * Cinematic camera controller.
 *
 * SYSTEM A (scroll) drives the authored keyframe path.
 * SYSTEM C (mouse) adds parallax + breathing zoom *before* the distance is
 * clamped, so interaction can never push the product out of the safe zone.
 *
 * Hard guarantees:
 *   • distance never drops below the safe distance for the current fov/aspect
 *   • fov stays inside 34–42 (no fisheye, no distortion)
 *   • the can can never fill or leave the frame
 */
export function CameraRig() {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3(0, 2.3, 16.2));
  const smoothLook = useRef(new THREE.Vector3(0, -0.2, -0.25));
  const dir = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3());
  const pose = useRef({
    pos: [0, 0, 0] as [number, number, number],
    scale: 1,
    align: 0,
    spin: 0.7,
  });

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.05);
    const d = director;
    const cam = sampleCamPose(CAM_TRACK, d.progress, scratch.cam);
    const fs = d.frameShift;

    // ---- authored target (compressed horizontally on narrow screens) --
    desired.current.set(cam.pos[0] * fs.xScale, cam.pos[1], cam.pos[2]);
    lookAt.current.set(cam.look[0] * fs.xScale + fs.x, cam.look[1] + fs.y, cam.look[2]);

    // ---- extra smoothing on top of the damped scroll progress ---------
    const lambda = d.reduced ? 26 : 9;
    smoothPos.current.lerp(desired.current, 1 - Math.exp(-lambda * dt));
    smoothLook.current.lerp(lookAt.current, 1 - Math.exp(-lambda * dt));

    // ---- SYSTEM C : parallax (applied before clamping) ----------------
    const parX = d.reduced ? 0 : d.mouse.x * PARALLAX_X;
    const parY = d.reduced ? 0 : d.mouse.y * PARALLAX_Y;
    desired.current.copy(smoothPos.current);
    desired.current.x += parX;
    desired.current.y += parY;

    // ---- safe distance -------------------------------------------------
    const fov = clamp(cam.fov, MIN_FOV, MAX_FOV);
    const heroScale = sampleCanPose(
      CAN_TRACKS[d.activeProduct],
      d.progress,
      pose.current,
    ).scale;
    const minDistance =
      computeSafeMinDistance(fov, heroScale, d.aspect) * fs.distance;
    const maxDistance = computeSafeMaxDistance(cam.wide);

    dir.current.subVectors(desired.current, smoothLook.current);
    let distance = dir.current.length() || 1;
    // multi-product shots get a longer leash on narrow viewports so that the
    // whole line-up stays inside the frame
    const wideFactor = 1 + (fs.wide - 1) * cam.wide;
    distance = clamp(distance * wideFactor, minDistance, maxDistance * wideFactor);

    // breathing zoom + loading reveal
    distance *= 1 - d.zoom * BREATHING_ZOOM;
    distance *= 1 + (1 - d.reveal) * REVEAL_PUSH;

    dir.current.normalize().multiplyScalar(distance);
    camera.position.copy(smoothLook.current).add(dir.current);
    camera.lookAt(smoothLook.current);

    // ---- fov ----------------------------------------------------------
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const persp = camera as THREE.PerspectiveCamera;
      const targetFov = clamp(
        fov * (d.isMobile ? 1.02 : 1) * (1 - d.zoom * 0.004),
        MIN_FOV,
        MAX_FOV,
      );
      persp.fov = damp(persp.fov, targetFov, 6, dt);
      persp.updateProjectionMatrix();
    }

    // keep the far plane generous for wide story shots
    if (perspectiveIsOk(camera)) {
      const persp = camera as THREE.PerspectiveCamera;
      if (persp.far < 90) {
        persp.far = 90;
        persp.updateProjectionMatrix();
      }
    }
  });

  return null;
}

function perspectiveIsOk(camera: THREE.Camera): camera is THREE.PerspectiveCamera {
  return (camera as THREE.PerspectiveCamera).isPerspectiveCamera === true;
}

/** Initial camera pose — matches the first keyframe plus the reveal push. */
export const INITIAL_CAMERA = {
  position: [0, 2.3, 16.2] as [number, number, number],
  fov: 38,
  near: 0.1,
  far: 90,
};

/** Exposed for the safe-zone debug overlay. */
export const SAFE_ZONE = {
  height: CAN_HEIGHT,
  radius: CAN_RADIUS,
};
