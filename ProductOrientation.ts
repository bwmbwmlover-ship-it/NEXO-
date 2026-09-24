import type * as THREE from "three";

/**
 * Label orientation system.
 *
 * Every can shares one coordinate contract — front = +Z, up = +Y, right = +X —
 * so a single function can solve the rotation that points the printed label
 * at the viewer, no matter which model/texture is loaded.
 */

/**
 * Returns the `rotation.y` that turns a product's front label (+Z) toward the
 * camera. Works for any product/camera position in world space.
 */
export function alignProductToCamera(
  productPos: THREE.Vector3 | { x: number; y: number; z: number },
  cameraPos: THREE.Vector3 | { x: number; y: number; z: number },
): number {
  return Math.atan2(cameraPos.x - productPos.x, cameraPos.z - productPos.z);
}

/** Shortest signed difference between two angles (-π … π). */
export function shortestAngleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

/** Blend any angle toward a target over the shortest arc. */
export function lerpAngle(current: number, target: number, t: number): number {
  return current + shortestAngleDelta(current, target) * t;
}

/** How far the label currently is from facing the camera (radians). */
export function labelFacingError(rotationY: number, faceAngle: number): number {
  return Math.abs(shortestAngleDelta(rotationY, faceAngle));
}
