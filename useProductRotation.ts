const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Product rotation controller.
 *
 * Owns the two rotation systems that must never fight each other:
 *
 *   SYSTEM B (time)  — continuous idle rotation, driven by the clock only.
 *   SYSTEM D (hero)  — front-label-to-camera alignment.
 *
 * Scroll and mouse never write to this value: they only change the *inputs*
 * (spin speed, align weight, face angle), which are combined here into one
 * continuous, jerk-free angle.
 *
 * The align weight is turned into a *presentation gate*. Below 50 % the can
 * spins completely free (no pull at all, so the idle rotation can never be
 * stalled by a tug-of-war between the two systems). Above 50 % the gate ramps
 * the shortest-arc pull in and the idle spin down, which produces one smooth
 * "catch and present" move instead of a fight.
 */
export class ProductRotationController {
  /** Free-running spin accumulator (radians, unbounded). */
  private angle: number;
  /** Phase accumulator for the presentation sway. */
  private swayPhase: number;
  private phase: number;

  constructor(phase = 0, initialAngle?: number) {
    this.phase = phase;
    this.angle = initialAngle ?? phase;
    this.swayPhase = phase * 0.7;
  }

  /**
   * @param dt          frame delta in seconds
   * @param spinSpeed   idle rotation speed in rad/s (0.45 – 0.95)
   * @param alignWeight 0 = free spin, 1 = front label locked to camera
   * @param faceAngle   rotation.y that points the label at the camera
   */
  update(
    dt: number,
    spinSpeed: number,
    alignWeight: number,
    faceAngle: number,
    reducedMotion: boolean,
  ): number {
    const w = clamp01(alignWeight);
    const motionScale = reducedMotion ? 0.32 : 1;

    // presentation gate: 0 → completely free spin, 1 → full alignment
    const t = clamp01((w - 0.5) / 0.5);
    const gate = t * t * (3 - 2 * t);

    // --- SYSTEM B: continuous idle rotation ---------------------------
    // Runs on the clock alone — it keeps turning when scrolling stops, and
    // only eases down once the product is actually being presented.
    this.angle += spinSpeed * motionScale * dt * (1 - gate * 0.9);

    // --- SYSTEM D: hero alignment -------------------------------------
    // Always solved over the shortest arc so the can never spins a full
    // turn to reach the camera — and never overshoots into a mirrored label.
    if (gate > 0.001) {
      let delta = faceAngle - this.angle;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      const pull = (reducedMotion ? 1.3 : 2.7) * gate;
      this.angle += delta * Math.min(1, pull * dt);
    }

    // --- presentation sway --------------------------------------------
    // A gentle oscillation around the camera-facing angle: the hero can keeps
    // moving like a real product shot while the label stays readable.
    const swayAmp = 0.5 * w * (reducedMotion ? 0.3 : 1);
    if (!reducedMotion) this.swayPhase += (0.4 + 0.24 * w) * dt;
    const sway = Math.sin(this.swayPhase + this.phase) * swayAmp;

    return this.angle + sway;
  }

  reset(angle: number) {
    this.angle = angle;
  }
}
