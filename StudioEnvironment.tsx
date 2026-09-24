import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { director } from "../lib/director";
import type { Quality } from "../lib/director";
import { CAN_TRACKS, sampleCanPose, type CanPose } from "../lib/tracks";
import { createBackdropTexture, createRadialTexture } from "./textures";

const FLOOR_Y = -1.5;

// -------------------------------------------------------------- lighting
function StudioLights() {
  const key = useRef<THREE.SpotLight>(null!);
  const accent = useRef<THREE.PointLight>(null!);
  const accent2 = useRef<THREE.PointLight>(null!);

  useFrame((_state, delta) => {
    const d = director;
    const dt = Math.min(delta, 0.05);
    if (accent.current) {
      accent.current.color.setRGB(d.accent[0], d.accent[1], d.accent[2]);
      // the key accent light follows the mouse a little (SYSTEM C)
      accent.current.position.x = dampNum(
        accent.current.position.x,
        d.mouse.x * 1.6,
        2.2,
        dt,
      );
      accent.current.position.y = dampNum(
        accent.current.position.y,
        1.2 + d.mouse.y * 0.9,
        2.2,
        dt,
      );
      accent.current.intensity = 26 + Math.sin(d.time * 0.7) * 4;
    }
    if (accent2.current) {
      accent2.current.color.setRGB(d.accent[0], d.accent[1], d.accent[2]);
      accent2.current.position.x = dampNum(
        accent2.current.position.x,
        -d.mouse.x * 2.2,
        2.2,
        dt,
      );
    }
    if (key.current) {
      key.current.position.x = dampNum(key.current.position.x, d.mouse.x * 0.9, 1.6, dt);
    }
  });

  return (
    <>
      <ambientLight intensity={0.28} />
      {/* key */}
      <spotLight
        ref={key}
        position={[1.5, 9.5, 6]}
        angle={0.72}
        penumbra={1}
        intensity={190}
        distance={40}
        decay={2}
        color="#ffffff"
      />
      {/* fill */}
      <directionalLight position={[-6, 3.5, 6]} intensity={0.55} color="#9fb6ff" />
      {/* rim */}
      <directionalLight position={[-5, 4.5, -7]} intensity={1.35} color="#6ea8ff" />
      <directionalLight position={[7, 2.5, -6]} intensity={0.95} color="#ffffff" />
      {/* coloured product accents */}
      <pointLight ref={accent} position={[0, 1.3, -3.4]} intensity={28} distance={16} decay={2} />
      <pointLight ref={accent2} position={[-4.5, -0.6, -6]} intensity={16} distance={20} decay={2} />
    </>
  );
}

function dampNum(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

// -------------------------------------------------------------- backdrop
function Backdrop() {
  const texture = useMemo(() => createBackdropTexture(), []);
  const material = useRef<THREE.MeshBasicMaterial>(null!);
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    const d = director;
    if (!material.current) return;
    // keep the huge backdrop dome out of the contact-shadow depth pass
    if (mesh.current && mesh.current.layers.mask !== 2) mesh.current.layers.set(1);
    // deep charcoal base, warmed by the active flavour
    material.current.color.setRGB(
      0.42 + d.accent[0] * 0.34,
      0.44 + d.accent[1] * 0.34,
      0.5 + d.accent[2] * 0.34,
    );
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[58, 32, 24]} />
      <meshBasicMaterial
        ref={material}
        map={texture}
        side={THREE.BackSide}
        toneMapped={false}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

// -------------------------------------------------------------- floor
function Floor({ quality }: { quality: Quality }) {
  const reflect = quality === "high";
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, -2]}>
      <planeGeometry args={[90, 90]} />
      {reflect ? (
        <MeshReflectorMaterial
          resolution={512}
          blur={[420, 110]}
          mixBlur={1.1}
          mixStrength={26}
          depthScale={1.15}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          roughness={0.86}
          metalness={0.42}
          color="#06070b"
          mirror={0.32}
        />
      ) : (
        <meshStandardMaterial color="#06070b" metalness={0.35} roughness={0.72} />
      )}
    </mesh>
  );
}

// -------------------------------------------------------------- atmosphere
function Atmosphere({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null!);
  const material = useRef<THREE.PointsMaterial>(null!);
  const sprite = useMemo(() => createRadialTexture(64), []);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 12 - 2.6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 26 - 4;
    }
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);

  useFrame((_state, delta) => {
    const d = director;
    const dt = Math.min(delta, 0.05);
    if (points.current && points.current.layers.mask !== 2) points.current.layers.set(1);
    if (d.reduced) return;
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += dt * (0.1 + (i % 7) * 0.035);
      arr[i * 3] += Math.sin(d.time * 0.25 + i) * dt * 0.02;
      if (arr[i * 3 + 1] > 9.4) arr[i * 3 + 1] = -2.6;
    }
    attr.needsUpdate = true;
    if (points.current) {
      points.current.rotation.y = Math.sin(d.time * 0.05) * 0.1 + d.mouse.x * 0.03;
    }
    if (material.current) {
      material.current.color.setRGB(
        0.65 + d.accent[0] * 0.35,
        0.68 + d.accent[1] * 0.35,
        0.72 + d.accent[2] * 0.35,
      );
    }
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        ref={material}
        size={0.05}
        sizeAttenuation
        map={sprite}
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </points>
  );
}

// -------------------------------------------------------------- accent glow
function AccentGlow() {
  const mesh = useRef<THREE.Mesh>(null!);
  const material = useRef<THREE.MeshBasicMaterial>(null!);
  const sprite = useMemo(
    () => createRadialTexture(256, [[0, "rgba(255,255,255,1)"], [0.28, "rgba(255,255,255,0.5)"], [1, "rgba(255,255,255,0)"]]),
    [],
  );
  const pose = useRef<CanPose>({ pos: [0, 0, 0], scale: 1, align: 0, spin: 0.7 });

  useFrame((state) => {
    const d = director;
    if (!mesh.current || !material.current) return;
    // layer 1 keeps additive FX out of the contact-shadow depth pass
    if (mesh.current.layers.mask !== 2) mesh.current.layers.set(1);
    const p = sampleCanPose(CAN_TRACKS[d.activeProduct], d.progress, pose.current);
    const z = Math.min(p.pos[2] - 3.6, -1.6);
    mesh.current.position.set(p.pos[0] * d.frameShift.xScale, p.pos[1] + 0.1, z);
    const s = 8.6 + Math.sin(d.time * 0.45) * 0.5;
    mesh.current.scale.set(s, s * 0.82, 1);
    mesh.current.quaternion.copy(state.camera.quaternion);
    material.current.color.setRGB(d.accent[0], d.accent[1], d.accent[2]);
    material.current.opacity = (0.34 + Math.sin(d.time * 0.6) * 0.05) * (0.35 + d.reveal * 0.65);
  });

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={material}
        map={sprite}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  );
}

// -------------------------------------------------------------- composition
export function StudioEnvironment({ quality }: { quality: Quality }) {
  const particles = quality === "high" ? 260 : quality === "mid" ? 150 : 80;

  return (
    <>
      <fog attach="fog" args={["#05060a", 17, 46]} />
      <StudioLights />
      <Backdrop />
      <Floor quality={quality} />
      <AccentGlow />
      <Atmosphere count={particles} />

      <ContactShadows
        position={[0, FLOOR_Y + 0.01, -2]}
        scale={30}
        resolution={quality === "high" ? 512 : 256}
        blur={2.6}
        opacity={0.62}
        far={4.2}
        color="#000000"
      />

      {/* baked studio reflections */}
      <Environment resolution={256} frames={1} background={false}>
        <color attach="background" args={["#05060a"]} />
        <Lightformer form="rect" intensity={2.6} color="#ffffff" scale={[13, 5, 1]} position={[0, 6.5, 6]} />
        <Lightformer form="rect" intensity={1.5} color="#8fb4ff" scale={[7, 12, 1]} position={[-8, 2, 3]} />
        <Lightformer form="rect" intensity={1.15} color="#ffd9c9" scale={[7, 12, 1]} position={[8, 1.5, -1]} />
        <Lightformer form="ring" intensity={3.4} color="#ffffff" scale={[4.4, 4.4, 1]} position={[0, 3.4, 7]} />
        <Lightformer form="rect" intensity={0.55} color="#ffffff" scale={[16, 5, 1]} position={[0, -5, 3]} rotation={[Math.PI / 2, 0, 0]} />
      </Environment>
    </>
  );
}
