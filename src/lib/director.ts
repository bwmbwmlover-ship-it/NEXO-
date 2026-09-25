import { useEffect, useRef, useState } from "react";
import { PRODUCTS, hexToRgb } from "./products";

export type SceneId =
  | "hero"
  | "catalog"
  | "featured"
  | "features"
  | "transitions"
  | "story"
  | "cta";

export interface SceneDef {
  id: SceneId;
  start: number;
  end: number;
}

/** Scroll timeline. Global progress 0..1 is mapped onto these scene windows. */
export const SCENES: SceneDef[] = [
  { id: "hero", start: 0.0, end: 0.15 },
  { id: "catalog", start: 0.15, end: 0.3 },
  { id: "featured", start: 0.3, end: 0.45 },
  { id: "features", start: 0.45, end: 0.6 },
  { id: "transitions", start: 0.6, end: 0.75 },
  { id: "story", start: 0.75, end: 0.88 },
  { id: "cta", start: 0.88, end: 1.0 },
];

export const SCENE_BY_ID: Record<SceneId, SceneDef> = SCENES.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<SceneId, SceneDef>,
);

export type Quality = "high" | "mid" | "low";

export interface FrameShift {
  /** Lateral framing bias applied to the camera look-target (world units). */
  x: number;
  /** Vertical framing bias — negative pushes the product up in frame. */
  y: number;
  /** Extra camera distance multiplier — keeps products clear of the edges. */
  distance: number;
  /**
   * Horizontal composition scale. Multi-can line-ups are authored for a wide
   * screen; narrow viewports compress the whole composition (products *and*
   * camera path together) so nothing is ever cropped at the sides.
   */
  xScale: number;
  /** Additional pull-back, only applied to multi-product (wide) shots. */
  wide: number;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

/**
 * Director — the single source of truth for every animation system.
 *
 *  SYSTEM A (scroll)  → camera path, product positions, scene selection
 *  SYSTEM B (time)    → continuous idle rotation, floating, particles
 *  SYSTEM C (mouse)   → parallax, breathing zoom, light offset, product tilt
 *  SYSTEM D (hero)    → front-label-to-camera alignment
 *
 * Nothing writes into three.js objects directly; consumers read from here
 * inside `useFrame`, which means the four systems can never overwrite
 * each other's values.
 */
class Director {
  // --- SYSTEM A : scroll -------------------------------------------------
  raw = 0;
  progress = 0;
  velocity = 0;
  sceneIndex = 0;
  sceneId: SceneId = "hero";
  sceneT = 0;
  activeProduct = 0;
  /** 0..1 progress inside the currently presented product (transitions scene). */
  productT = 0;

  // --- SYSTEM C : mouse --------------------------------------------------
  mouse = { x: 0, y: 0 };
  private mouseTarget = { x: 0, y: 0 };
  private mouseRaw = { x: 0, y: 0 };
  /** Radial mouse distance 0..1 — drives the subtle "breathing" zoom. */
  zoom = 0;
  pointerActive = false;

  // --- presentation ------------------------------------------------------
  accent: [number, number, number] = hexToRgb(PRODUCTS[0].accent);
  private accentTarget: [number, number, number] = this.accent;
  accentCss = PRODUCTS[0].accent;

  // --- environment -------------------------------------------------------
  quality: Quality = "high";
  isMobile = false;
  aspect = 1.77;
  reduced = false;
  frameShift: FrameShift = { x: 0, y: -0.06, distance: 1, xScale: 1, wide: 1 };

  // --- lifecycle ---------------------------------------------------------
  loading = true;
  loadProgress = 0;
  entered = false;
  reveal = 0;
  time = 0;
  frame = 0;

  private listeners = new Set<() => void>();
  private raf = 0;
  private last = 0;
  private started = false;
  private seek: ((y: number, immediate?: boolean) => void) | null = null;
  private maxScroll = 1;

  // ------------------------------------------------------------------ api
  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    if (this.listeners.size === 0) return;
    for (const fn of this.listeners) fn();
  }

  attachSeek(fn: ((y: number, immediate?: boolean) => void) | null) {
    this.seek = fn;
  }

  setScrollMetrics(maxScroll: number) {
    this.maxScroll = Math.max(1, maxScroll);
  }

  setLoad(p: number) {
    this.loadProgress = clamp(p, 0, 1);
    this.notify();
  }

  /** Called once the loading screen has fully faded out. */
  enter() {
    this.entered = true;
    this.loading = false;
    this.notify();
  }

  setQuality(q: Quality, isMobile: boolean, aspect: number) {
    this.quality = q;
    this.isMobile = isMobile;
    this.aspect = aspect;
    this.frameShift = getFrameShift(q, isMobile, aspect);
    this.notify();
  }

  setReduced(v: boolean) {
    this.reduced = v;
    this.notify();
  }

  /** Max scrollable pixels for the current document. */
  get maxScrollPx() {
    return this.maxScroll;
  }

  scrollToProgress(p: number, immediate = false) {
    const y = clamp(p, 0, 1) * this.maxScroll;
    if (this.seek) this.seek(y, immediate);
    else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
  }

  // ------------------------------------------------------------- main loop
  start() {
    if (this.started) return;
    this.started = true;
    this.last = performance.now();

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        this.pointerActive = false;
        return;
      }
      this.pointerActive = true;
      this.mouseRaw.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseRaw.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onLeave = () => {
      this.mouseRaw.x = 0;
      this.mouseRaw.y = 0;
      this.pointerActive = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("blur", onLeave, { passive: true });

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000) || 0.016;
      this.last = now;
      this.update(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);

    this.stopListeners = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }

  private stopListeners: (() => void) | null = null;

  stop() {
    cancelAnimationFrame(this.raf);
    this.started = false;
    this.stopListeners?.();
    this.stopListeners = null;
  }

  // ------------------------------------------------------------- update
  private update(dt: number) {
    this.time += dt;
    this.frame++;

    // ---- SYSTEM A : scroll (heavily damped so scroll never "snaps") ----
    this.raw = clamp(
      (window.scrollY || window.pageYOffset || 0) / this.maxScroll,
      0,
      1,
    );
    const prev = this.progress;
    this.progress = damp(this.progress, this.raw, this.reduced ? 30 : 8.5, dt);
    if (Math.abs(this.progress - this.raw) < 0.00015) this.progress = this.raw;
    this.velocity = (this.progress - prev) / Math.max(dt, 1e-4);

    // scene lookup
    const p = this.progress;
    let idx = SCENES.length - 1;
    for (let i = 0; i < SCENES.length; i++) {
      if (p < SCENES[i].end || i === SCENES.length - 1) {
        idx = i;
        break;
      }
    }
    const scene = SCENES[idx];
    const span = Math.max(1e-5, scene.end - scene.start);
    this.sceneIndex = idx;
    this.sceneId = scene.id;
    this.sceneT = clamp((p - scene.start) / span, 0, 1);

    // active product
    const nextProduct = this.resolveActiveProduct(scene.id, this.sceneT);
    if (nextProduct !== this.activeProduct) {
      this.activeProduct = nextProduct;
      this.accentTarget = hexToRgb(PRODUCTS[nextProduct].accent);
    }
    this.productT = this.resolveProductT(scene.id, this.sceneT);

    // ---- SYSTEM C : mouse ---------------------------------------------
    const mouseLambda = this.reduced ? 0 : 4.2;
    this.mouseTarget.x = this.reduced || !this.pointerActive ? 0 : this.mouseRaw.x;
    this.mouseTarget.y = this.reduced || !this.pointerActive ? 0 : this.mouseRaw.y;
    this.mouse.x = damp(this.mouse.x, this.mouseTarget.x, mouseLambda, dt);
    this.mouse.y = damp(this.mouse.y, this.mouseTarget.y, mouseLambda, dt);
    const radial = clamp(Math.hypot(this.mouse.x, this.mouse.y), 0, 1);
    this.zoom = damp(this.zoom, radial, 2.4, dt);

    // ---- accent colour -------------------------------------------------
    for (let i = 0; i < 3; i++) {
      this.accent[i] = damp(this.accent[i], this.accentTarget[i], 2.6, dt);
    }

    // ---- reveal --------------------------------------------------------
    if (this.entered && this.reveal < 1) {
      this.reveal = Math.min(1, this.reveal + dt * 0.42);
    }

    this.notify();
  }

  private resolveActiveProduct(scene: SceneId, t: number): number {
    if (scene === "transitions") {
      return clamp(Math.floor(t * PRODUCTS.length), 0, PRODUCTS.length - 1);
    }
    if (scene === "catalog") {
      // gently hand over to the featured can at the end of the catalogue
      return t > 0.78 ? 0 : 0;
    }
    return 0;
  }

  private resolveProductT(scene: SceneId, t: number): number {
    if (scene !== "transitions") return 0;
    const n = PRODUCTS.length;
    const local = t * n;
    return clamp(local - Math.floor(local), 0, 1);
  }
}

/** Framing / safe-distance response per breakpoint. */
export function getFrameShift(q: Quality, isMobile: boolean, aspect: number): FrameShift {
  // Lower render tiers get a touch more breathing room so the product always
  // reads clearly, even without post-processing and reflections.
  const tier = q === "low" ? 1.05 : q === "mid" ? 1.02 : 1;
  // A negative y-bias pitches the camera down, which lifts the product into
  // the upper half of the frame — that is what keeps every can clear of the
  // bottom-anchored copy on phones and tablets.
  const xScale = Math.min(1, Math.max(0.55, aspect / 1.75));
  if (isMobile) {
    const narrow = aspect < 0.62;
    return {
      x: 0,
      y: -1.15,
      distance: (narrow ? 1.3 : 1.2) * tier,
      xScale,
      wide: narrow ? 1.45 : 1.3,
    };
  }
  if (aspect < 1.05)
    return { x: 0, y: -0.82, distance: 1.16 * tier, xScale, wide: 1.15 };
  if (aspect < 1.4)
    return { x: 0, y: -0.42, distance: 1.08 * tier, xScale, wide: 1.05 };
  return { x: 0, y: -0.06, distance: tier, xScale, wide: 1 };
}

export const director = new Director();

// ------------------------------------------------------------- react glue

/** Imperative per-frame subscription — never triggers a react re-render. */
export function useFrameSubscription(cb: (d: Director) => void) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => director.subscribe(() => ref.current(director)), []);
}

const shallowEq = (a: unknown, b: unknown) =>
  Array.isArray(a) && Array.isArray(b)
    ? a.length === b.length && a.every((v, i) => v === b[i])
    : a === b;

/**
 * Subscribe to a discrete slice of the director. Only re-renders when the
 * selected value actually changes (used for scene / product / language UI).
 */
export function useDirectorSelector<T>(select: (d: Director) => T): T {
  const [value, setValue] = useState<T>(() => select(director));
  const valueRef = useRef(value);
  const selectRef = useRef(select);
  selectRef.current = select;

  useEffect(
    () =>
      director.subscribe(() => {
        const next = selectRef.current(director);
        if (!shallowEq(next, valueRef.current)) {
          valueRef.current = next;
          setValue(next);
        }
      }),
    [],
  );

  return value;
}

export const useSceneIndex = () => useDirectorSelector((d) => d.sceneIndex);
export const useActiveProduct = () => useDirectorSelector((d) => d.activeProduct);
export const useIsEntered = () => useDirectorSelector((d) => d.entered);
