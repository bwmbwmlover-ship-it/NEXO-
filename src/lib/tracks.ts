import { CAN_BOUND_RADIUS, CAN_RADIUS, PRODUCTS } from "./products";

export type V3 = [number, number, number];

export interface CanPose {
  pos: V3;
  scale: number;
  /** 0 = free spin, 1 = front label locked toward camera. */
  align: number;
  /** Continuous idle rotation speed (rad / s). */
  spin: number;
}

export interface CanKey extends CanPose {
  p: number;
}

export interface CamPose {
  pos: V3;
  look: V3;
  fov: number;
  /** 1 = wide multi-product framing, 0 = single hero product framing. */
  wide: number;
}

export interface CamKey extends CamPose {
  p: number;
}

// ---------------------------------------------------------------------------
// Camera safety — the product must never fill the screen, never clip and
// never leave the safe zone (≈70% of viewport height / 60% of width).
// ---------------------------------------------------------------------------
export const MIN_CAMERA_DISTANCE = 3.8;
export const MAX_CAMERA_DISTANCE = 7.5;
/** Wide, multi-can compositions need a longer leash than a single hero can. */
export const MAX_GROUP_DISTANCE = 15;
export const SAFE_HEIGHT_FRACTION = 0.66;
export const SAFE_WIDTH_FRACTION = 0.62;
export const MIN_FOV = 34;
export const MAX_FOV = 42;

const DEG = Math.PI / 180;

/**
 * Smallest camera distance that still keeps the entire can inside the safe
 * zone for the current fov / aspect / product scale.
 */
export function computeSafeMinDistance(fovDeg: number, scale: number, aspect: number) {
  const halfV = Math.tan((fovDeg * 0.5) * DEG);
  const dH = (CAN_BOUND_RADIUS * scale) / (SAFE_HEIGHT_FRACTION * halfV);
  const dW = (CAN_RADIUS * scale) / (SAFE_WIDTH_FRACTION * halfV * Math.max(aspect, 0.35));
  return Math.max(MIN_CAMERA_DISTANCE, dH, dW);
}

export function computeSafeMaxDistance(wide: number) {
  return MAX_CAMERA_DISTANCE + (MAX_GROUP_DISTANCE - MAX_CAMERA_DISTANCE) * wide;
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number, out: V3) => {
  out[0] = lerp(a[0], b[0], t);
  out[1] = lerp(a[1], b[1], t);
  out[2] = lerp(a[2], b[2], t);
  return out;
};

export function sampleCanPose(keys: CanKey[], p: number, out: CanPose): CanPose {
  const n = keys.length;
  if (n === 0) return out;
  if (p <= keys[0].p) return Object.assign(out, keys[0]);
  if (p >= keys[n - 1].p) return Object.assign(out, keys[n - 1]);
  for (let i = 0; i < n - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (p >= a.p && p <= b.p) {
      const span = b.p - a.p;
      const t = smoothstep(span <= 1e-6 ? 1 : (p - a.p) / span);
      lerp3(a.pos, b.pos, t, out.pos);
      out.scale = lerp(a.scale, b.scale, t);
      out.align = lerp(a.align, b.align, t);
      out.spin = lerp(a.spin, b.spin, t);
      return out;
    }
  }
  return Object.assign(out, keys[n - 1]);
}

export function sampleCamPose(keys: CamKey[], p: number, out: CamPose): CamPose {
  const n = keys.length;
  if (n === 0) return out;
  if (p <= keys[0].p) {
    Object.assign(out, keys[0]);
    return out;
  }
  if (p >= keys[n - 1].p) {
    Object.assign(out, keys[n - 1]);
    return out;
  }
  for (let i = 0; i < n - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (p >= a.p && p <= b.p) {
      const span = b.p - a.p;
      const t = smoothstep(span <= 1e-6 ? 1 : (p - a.p) / span);
      lerp3(a.pos, b.pos, t, out.pos);
      lerp3(a.look, b.look, t, out.look);
      out.fov = lerp(a.fov, b.fov, t);
      out.wide = lerp(a.wide, b.wide, t);
      return out;
    }
  }
  Object.assign(out, keys[n - 1]);
  return out;
}

// ---------------------------------------------------------------------------
// Track construction
// ---------------------------------------------------------------------------
const pose = (
  pos: V3,
  scale = 1,
  align = 0.2,
  spin = 0.7,
): CanPose => ({ pos, scale, align, spin });

/** 0.00 – 0.15 : cinematic hero, depth-composed lineup */
const HERO: CanPose[] = [
  pose([0, 0.02, 0.2], 1.02, 0.18, 0.72),
  pose([-2.05, -0.12, -1.55], 0.94, 0.12, 0.86),
  pose([2.1, -0.08, -1.35], 0.92, 0.12, 0.82),
  pose([-3.95, -0.2, -4.2], 0.84, 0.1, 0.95),
  pose([4.1, -0.22, -3.9], 0.84, 0.1, 0.9),
];

const HERO_MID: CanPose[] = [
  pose([0, 0, 0.35], 1.02, 0.22, 0.7),
  pose([-3.2, -0.08, -2.1], 0.94, 0.16, 0.8),
  pose([2.8, -0.05, -2.5], 0.92, 0.16, 0.78),
  pose([-4.2, -0.16, -4.4], 0.84, 0.12, 0.92),
  pose([4.35, -0.16, -4.1], 0.84, 0.12, 0.88),
];

/** 0.15 – 0.30 : catalogue arc, camera tracks horizontally */
const CATALOG: CanPose[] = [
  pose([0, 0, 0.15], 1.0, 0.3, 0.7),
  pose([-4.4, 0, -1.5], 0.96, 0.26, 0.75),
  pose([-2.2, 0, -0.5], 0.97, 0.26, 0.74),
  pose([2.2, 0, -0.5], 0.97, 0.26, 0.74),
  pose([4.4, 0, -1.5], 0.96, 0.26, 0.75),
];

const CATALOG_MID: CanPose[] = [
  pose([0, 0, 0.5], 1.02, 0.64, 0.66),
  pose([-4.5, 0, -1.7], 0.95, 0.22, 0.78),
  pose([-2.3, 0, -0.8], 0.96, 0.22, 0.76),
  pose([2.3, 0, -0.8], 0.96, 0.22, 0.76),
  pose([4.5, 0, -1.7], 0.95, 0.22, 0.78),
];

/** 0.30 – 0.45 : featured hero product (DOUBLE LITCHI) */
const FEATURED: CanPose[] = [
  pose([0.75, -0.02, 0.6], 1.05, 1, 0.62),
  pose([0.78, -0.05, 0.7], 1.05, 1, 0.62),
];

/** 0.45 – 0.60 : feature call-outs orbit around the product */
const FEATURES: CanPose[] = [
  pose([0.62, 0.02, 0.55], 1.0, 1, 0.58),
  pose([0.5, 0.05, 0.42], 1.0, 1, 0.58),
];

/** 0.60 – 0.75 : product changeovers */
const TRANSITIONS_FROM = 0.6;
const TRANSITIONS_SPAN = 0.15;
const T_STEP = TRANSITIONS_SPAN / PRODUCTS.length;
const T_ENTER = 0.018;
const T_HOLD = 0.011;
const T_EXIT = 0.019;

const slotX = (i: number) => (i - 2) * 1.7;
const backStage = (i: number): CanPose =>
  pose([slotX(i), 0, -5.4], 0.9, 0.12, 0.9);
const heroStage = (): CanPose => pose([0, 0, 0.62], 1.05, 1, 0.62);

/** 0.75 – 0.88 : brand story — receding diagonal */
const STORY: CanPose[] = [
  pose([-0.5, 0.08, -0.6], 1.0, 0.45, 0.7),
  pose([0.95, -0.06, -2.3], 0.98, 0.4, 0.76),
  pose([2.3, 0.12, -4.0], 0.95, 0.36, 0.8),
  pose([3.6, -0.1, -5.7], 0.92, 0.32, 0.84),
  pose([4.9, 0.06, -7.3], 0.9, 0.32, 0.88),
];

const STORY_MID: CanPose[] = [
  pose([-0.15, 0.0, -0.6], 1.0, 0.42, 0.7),
  pose([0.3, 0, -2.9], 0.98, 0.38, 0.76),
  pose([2.0, 0.05, -4.2], 0.95, 0.34, 0.8),
  pose([3.3, -0.05, -5.6], 0.92, 0.3, 0.84),
  pose([4.6, 0.05, -7.0], 0.9, 0.3, 0.88),
];

/** 0.88 – 1.00 : balanced finale lineup, every label facing the viewer */
const CTA: CanPose[] = [
  pose([0, 0.02, 0.55], 1.06, 0.95, 0.66),
  pose([-1.58, -0.02, -0.55], 1.0, 0.9, 0.7),
  pose([1.58, -0.02, -0.55], 1.0, 0.9, 0.7),
  pose([-3.15, -0.08, -1.95], 0.94, 0.85, 0.74),
  pose([3.15, -0.08, -1.95], 0.94, 0.85, 0.74),
];

const CTA_MID: CanPose[] = [
  pose([0, 0.02, 0.35], 1.05, 0.92, 0.68),
  pose([-1.6, 0, -0.9], 1.0, 0.87, 0.7),
  pose([1.6, 0, -0.9], 1.0, 0.87, 0.7),
  pose([-3.2, -0.04, -2.1], 0.94, 0.82, 0.74),
  pose([3.2, -0.04, -2.1], 0.94, 0.82, 0.74),
];

function buildCanTracks(): CanKey[][] {
  const tracks: CanKey[][] = PRODUCTS.map(() => []);

  const push = (i: number, p: number, s: CanPose) => tracks[i].push({ p, ...s });

  // hero → catalogue
  PRODUCTS.forEach((_, i) => {
    push(i, 0, HERO[i]);
    push(i, 0.075, HERO_MID[i]);
    push(i, 0.15, CATALOG[i]);
    push(i, 0.225, CATALOG_MID[i]);
  });

  // 0.30 — everything except the hero recedes into depth
  push(0, 0.3, FEATURED[0]);
  push(0, 0.375, FEATURED[1]);
  push(1, 0.3, pose([-6.6, 0, -6.2], 0.9, 0.1, 0.85));
  push(2, 0.3, pose([-3.9, 0, -4.4], 0.9, 0.1, 0.85));
  push(3, 0.3, pose([3.9, 0, -4.4], 0.9, 0.1, 0.85));
  push(4, 0.3, pose([6.6, 0, -6.2], 0.9, 0.1, 0.85));

  // 0.45 – 0.60 — feature scene, hero stays comfortable in frame
  push(0, 0.45, FEATURES[0]);
  push(0, 0.525, FEATURES[1]);
  push(0, 0.6, heroStage());

  // 0.60 – 0.75 — changeovers
  for (let i = 0; i < PRODUCTS.length; i++) {
    const heroAt = TRANSITIONS_FROM + i * T_STEP;
    if (i === 0) {
      push(i, TRANSITIONS_FROM, heroStage());
      push(i, TRANSITIONS_FROM + T_HOLD, heroStage());
      push(i, TRANSITIONS_FROM + T_HOLD + T_EXIT, backStage(0));
    } else {
      push(i, heroAt - T_ENTER, backStage(i));
      push(i, heroAt, heroStage());
      push(i, heroAt + T_HOLD, heroStage());
      push(i, heroAt + T_HOLD + T_EXIT, backStage(i));
    }
  }

  // 0.75 – 0.88 — brand story
  PRODUCTS.forEach((_, i) => {
    push(i, 0.79, STORY[i]);
    push(i, 0.85, STORY_MID[i]);
  });

  // 0.88 – 1.00 — finale
  PRODUCTS.forEach((_, i) => {
    push(i, 0.88, CTA[i]);
    push(i, 0.94, CTA_MID[i]);
    push(i, 1, CTA[i]);
  });

  return tracks.map(finalizeCan);
}

function finalizeCan(keys: CanKey[]): CanKey[] {
  const sorted = [...keys].sort((a, b) => a.p - b.p);
  const out: CanKey[] = [];
  for (const k of sorted) {
    if (out.length && Math.abs(out[out.length - 1].p - k.p) < 1e-4) continue;
    out.push(k);
  }
  return out;
}

function buildCamTrack(): CamKey[] {
  const keys: CamKey[] = [
    { p: 0, pos: [0, 1.62, 10.6], look: [0, -0.2, -0.25], fov: 38, wide: 1 },
    { p: 0.075, pos: [0.42, 0.95, 9.0], look: [0.05, -0.05, -0.1], fov: 38, wide: 1 },
    { p: 0.15, pos: [-2.4, 0.72, 8.25], look: [-2.05, -0.02, -0.75], fov: 38, wide: 1 },
    { p: 0.225, pos: [-1.1, 0.46, 7.35], look: [-0.5, 0.02, -0.15], fov: 37.5, wide: 1 },
    { p: 0.3, pos: [0.1, 0.3, 7.8], look: [-0.15, 0.02, 0.3], fov: 37, wide: 0 },
    { p: 0.375, pos: [0.14, 0.26, 7.85], look: [-0.12, 0.06, 0.42], fov: 37, wide: 0 },
    { p: 0.45, pos: [3.0, 1.2, 7.05], look: [0.5, 0.12, 0.45], fov: 37, wide: 0 },
    { p: 0.525, pos: [3.45, 0.5, 6.85], look: [0.45, 0, 0.38], fov: 37, wide: 0 },
    { p: 0.6, pos: [0.35, 0.34, 7.6], look: [0.05, 0.02, 0.3], fov: 37, wide: 0 },
  ];

  // product changeovers: confident lateral tracking shot
  for (let i = 0; i < PRODUCTS.length; i++) {
    const heroAt = TRANSITIONS_FROM + i * T_STEP;
    keys.push({
      p: heroAt,
      pos: [0.35, 0.34, 7.6],
      look: [0.05, 0.02, 0.3],
      fov: 37,
      wide: 0,
    });
    if (i < PRODUCTS.length - 1) {
      keys.push({
        p: heroAt + T_STEP * 0.5,
        pos: [-0.62, 0.72, 8.35],
        look: [-0.16, 0.06, -0.55],
        fov: 37.5,
        wide: 0,
      });
    }
  }

  keys.push(
    { p: 0.79, pos: [-1.75, 1.05, 8.1], look: [-1.15, 0.05, -1.9], fov: 38, wide: 1 },
    { p: 0.85, pos: [-2.05, 0.85, 8.75], look: [-1.5, 0, -2.6], fov: 38, wide: 1 },
    { p: 0.88, pos: [0, 0.78, 8.9], look: [0, 0.02, -0.35], fov: 38, wide: 1 },
    { p: 0.94, pos: [0, 0.9, 10.1], look: [0, 0.05, -0.5], fov: 38, wide: 1 },
    { p: 1, pos: [0, 1.02, 11.8], look: [0, 0.08, -0.7], fov: 38, wide: 1 },
  );

  const sorted = [...keys].sort((a, b) => a.p - b.p);
  const out: CamKey[] = [];
  for (const k of sorted) {
    if (out.length && Math.abs(out[out.length - 1].p - k.p) < 1e-4) continue;
    out.push(k);
  }
  return out;
}

export const CAN_TRACKS: CanKey[][] = buildCanTracks();
export const CAM_TRACK: CamKey[] = buildCamTrack();

/** Shared scratch objects — avoids per-frame allocation in the render loop. */
export const scratch = {
  can: {
    pos: [0, 0, 0] as V3,
    scale: 1,
    align: 0,
    spin: 0.7,
  } as CanPose,
  cam: {
    pos: [0, 0, 0] as V3,
    look: [0, 0, 0] as V3,
    fov: 38,
    wide: 1,
  } as CamPose,
};
