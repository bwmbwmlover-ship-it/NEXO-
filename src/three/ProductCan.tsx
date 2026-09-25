import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { director } from "../lib/director";
import { CAN_TRACKS, sampleCanPose, type CanPose } from "../lib/tracks";
import { ProductRotationController } from "../hooks/useProductRotation";
import { alignProductToCamera } from "./ProductOrientation";
import { CanModel } from "./CanModel";

interface ProductCanProps {
  index: number;
}

/**
 * A single animated can.
 *
 * Nested groups keep the animation systems physically separated so they can
 * never overwrite each other:
 *
 *   root  → SYSTEM A  scroll placement + scale + floating (SYSTEM B)
 *   tilt  → SYSTEM C  mouse tilt
 *   spin  → SYSTEM B  idle rotation  +  SYSTEM D hero label alignment
 */
export function ProductCan({ index }: ProductCanProps) {
  const root = useRef<THREE.Group>(null!);
  const tilt = useRef<THREE.Group>(null!);
  const spin = useRef<THREE.Group>(null!);
  const controller = useMemo(
    () => new ProductRotationController(index * 1.83, index * 0.9),
    [index],
  );
  const pose = useRef<CanPose>({ pos: [0, 0, 0], scale: 1, align: 0, spin: 0.7 });
  const worldPos = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const d = director;
    const p = sampleCanPose(CAN_TRACKS[index], d.progress, pose.current);
    const t = d.time;

    // ---- SYSTEM A : scroll placement (never touches rotation) ----------
    const floatY = d.reduced ? 0 : Math.sin(t * 0.55 + index * 1.37) * 0.05;
    const drift = d.reduced ? 0 : Math.sin(t * 0.27 + index * 0.71) * 0.035;
    const xScale = d.frameShift.xScale;
    root.current.position.set(
      p.pos[0] * xScale + drift * xScale,
      p.pos[1] + floatY,
      p.pos[2],
    );
    root.current.scale.setScalar(p.scale);

    // ---- SYSTEM C : mouse tilt (kept tiny so the safe zone holds) ------
    const targetX = d.reduced ? 0 : -d.mouse.y * 0.055;
    const targetZ = d.reduced ? 0 : d.mouse.x * 0.05;
    tilt.current.rotation.x += (targetX - tilt.current.rotation.x) * 0.1;
    tilt.current.rotation.z += (targetZ - tilt.current.rotation.z) * 0.1;

    // ---- SYSTEM B + D : rotation --------------------------------------
    root.current.getWorldPosition(worldPos.current);
    const faceAngle = alignProductToCamera(worldPos.current, state.camera.position);
    spin.current.rotation.y = controller.update(
      dt,
      p.spin,
      p.align,
      faceAngle,
      d.reduced,
    );
  });

  return (
    <group ref={root}>
      <group ref={tilt}>
        <group ref={spin}>
          <CanModel index={index} />
        </group>
      </group>
    </group>
  );
}
