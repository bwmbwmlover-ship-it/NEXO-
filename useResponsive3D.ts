import { useEffect, useState } from "react";
import { director, type Quality } from "../lib/director";

export interface Responsive3D {
  tier: Quality;
  isMobile: boolean;
  aspect: number;
  dpr: [number, number];
  post: boolean;
  width: number;
}

function compute(): Responsive3D {
  const width = typeof window === "undefined" ? 1440 : window.innerWidth;
  const height = typeof window === "undefined" ? 900 : window.innerHeight;
  const aspect = width / Math.max(1, height);
  const deviceDpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const cores = typeof navigator === "undefined" ? 4 : navigator.hardwareConcurrency || 4;
  const touch =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || (navigator.maxTouchPoints || 0) > 0);

  const isMobile = width < 820 || (touch && width < 1100);

  let tier: Quality;
  if (isMobile) {
    tier = deviceDpr > 2.4 || cores <= 4 ? "low" : "mid";
  } else {
    tier = cores >= 6 && width >= 1280 ? "high" : "mid";
  }

  const dpr: [number, number] =
    tier === "high" ? [1, 1.9] : tier === "mid" ? [1, 1.55] : [0.85, 1.3];

  return { tier, isMobile, aspect, dpr, post: tier === "high", width };
}

/**
 * Responsive 3D budget. Devices are never simply "shrunk down" — smaller or
 * slower hardware gets a different camera distance, particle count, DPR,
 * reflection and post-processing budget.
 */
export function useResponsive3D(): Responsive3D {
  const [state, setState] = useState<Responsive3D>(compute);

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setState(compute()));
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  useEffect(() => {
    director.setQuality(state.tier, state.isMobile, state.aspect);
  }, [state]);

  return state;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    director.setReduced(reduced);
  }, [reduced]);

  return reduced;
}
