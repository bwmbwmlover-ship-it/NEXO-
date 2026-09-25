import { memo, Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { useResponsive3D } from "../hooks/useResponsive3D";
import { StudioEnvironment } from "./StudioEnvironment";
import { ProductManager } from "./ProductManager";
import { CameraRig, INITIAL_CAMERA } from "./CameraRig";

function FirstFrame({ onFirstFrame }: { onFirstFrame?: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current || !onFirstFrame) return;
    done.current = true;
    onFirstFrame();
  });
  return null;
}

function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.62}
        luminanceThreshold={0.58}
        luminanceSmoothing={0.3}
        mipmapBlur
        radius={0.74}
      />
      <Vignette offset={0.28} darkness={0.62} eskil={false} />
    </EffectComposer>
  );
}

function ExperienceImpl({ onFirstFrame }: { onFirstFrame?: () => void }) {
  const { tier, dpr } = useResponsive3D();

  return (
    <Canvas
      dpr={dpr}
      shadows={false}
      frameloop="always"
      camera={INITIAL_CAMERA}
      gl={{
        antialias: tier !== "low",
        alpha: false,
        stencil: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl, scene, camera }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.04;
        scene.background = new THREE.Color("#05060a");
        // layer 1 carries additive atmosphere FX (glow, particles, backdrop)
        // so they never leak into the contact-shadow depth pass
        camera.layers.enable(1);
      }}
    >
      <Suspense fallback={null}>
        <StudioEnvironment quality={tier} />
        <ProductManager />
        <CameraRig />
        <FirstFrame onFirstFrame={onFirstFrame} />
        {tier === "high" && <PostFX />}
      </Suspense>
    </Canvas>
  );
}

/**
 * Memoised so the (expensive) WebGL tree never reconciles while the loader is
 * ticking up its counter — the only inputs are the callback and the internal
 * responsive budget.
 */
export const Experience = memo(ExperienceImpl);
