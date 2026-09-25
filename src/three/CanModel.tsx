import { useMemo } from "react";
import * as THREE from "three";
import { CAN_HEIGHT, CAN_RADIUS } from "../lib/products";
import { getLabelTexture } from "./textures";

const H = CAN_HEIGHT;
const R = CAN_RADIUS;

// Shared geometry — created once for every can in the scene.
const bodyGeo = new THREE.CylinderGeometry(R, R, H * 0.85, 128, 1, true, Math.PI, Math.PI * 2);
const topNeckGeo = new THREE.CylinderGeometry(R * 0.9, R, 0.11, 96, 1, true);
const rimGeo = new THREE.TorusGeometry(R * 0.9, 0.032, 12, 96);
const lidGeo = new THREE.CylinderGeometry(R * 0.9, R * 0.9, 0.035, 96);
const scoreGeo = new THREE.BoxGeometry(0.34, 0.014, 0.24);
const tabGeo = new THREE.TorusGeometry(0.095, 0.026, 8, 24);
const rivetGeo = new THREE.SphereGeometry(0.042, 14, 12);
const bottomNeckGeo = new THREE.CylinderGeometry(R, R * 0.84, 0.1, 96, 1, true);
const bottomRimGeo = new THREE.TorusGeometry(R * 0.84, 0.028, 8, 96);
const baseGeo = new THREE.CylinderGeometry(R * 0.84, R * 0.84, 0.03, 96);

/** Shared brushed-aluminium material for lid, rim and base. */
export const aluminiumMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#c9d3dd"),
  metalness: 1,
  roughness: 0.17,
  clearcoat: 0.65,
  clearcoatRoughness: 0.12,
  envMapIntensity: 1.7,
});

const lidMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#b8c2cd"),
  metalness: 1,
  roughness: 0.26,
  clearcoat: 0.5,
  envMapIntensity: 1.5,
});

export interface CanModelProps {
  index: number;
}

/**
 * Physically-inspired slim energy can.
 *
 * Orientation contract (required by the label alignment system):
 *   front  = +Z   (the printed wordmark faces +Z)
 *   up     = +Y
 *   right  = +X
 *
 * The label cylinder uses `thetaStart = Math.PI` so that texture u = 0.5
 * lands exactly on +Z — that is what guarantees the front label is never
 * mirrored and always readable.
 */
export function CanModel({ index }: CanModelProps) {
  const labelMaterial = useMemo(() => {
    const map = getLabelTexture(index);
    return new THREE.MeshPhysicalMaterial({
      map,
      metalness: 0.74,
      roughness: 0.27,
      clearcoat: 1,
      clearcoatRoughness: 0.13,
      envMapIntensity: 1.4,
    });
  }, [index]);

  return (
    <group>
      {/* printed body */}
      <mesh geometry={bodyGeo} material={labelMaterial} />

      {/* top taper + rim + lid */}
      <mesh geometry={topNeckGeo} material={aluminiumMaterial} position={[0, H * 0.425 + 0.055, 0]} />
      <mesh geometry={rimGeo} material={aluminiumMaterial} position={[0, H * 0.425 + 0.115, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={lidGeo} material={lidMaterial} position={[0, H * 0.425 + 0.135, 0]} />
      <mesh geometry={scoreGeo} material={lidMaterial} position={[0, H * 0.425 + 0.157, 0.09]} />
      <mesh
        geometry={tabGeo}
        material={aluminiumMaterial}
        position={[0, H * 0.425 + 0.168, -0.02]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh geometry={rivetGeo} material={aluminiumMaterial} position={[0, H * 0.425 + 0.17, 0.03]} />

      {/* bottom taper + base */}
      <mesh geometry={bottomNeckGeo} material={aluminiumMaterial} position={[0, -H * 0.425 - 0.05, 0]} />
      <mesh
        geometry={bottomRimGeo}
        material={aluminiumMaterial}
        position={[0, -H * 0.425 - 0.1, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh geometry={baseGeo} material={lidMaterial} position={[0, -H * 0.425 - 0.115, 0]} />
    </group>
  );
}
