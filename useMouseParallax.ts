import { useEffect, useRef } from "react";
import { useFrameSubscription } from "../lib/director";

/**
 * SYSTEM C — mouse parallax for DOM layers.
 *
 * Writes a transform directly to a DOM node inside the rAF loop, so it never
 * triggers a react render and never fights the scroll-driven block opacity.
 * The 3D scene has its own (much smaller) camera parallax.
 */
export function useMouseParallax<T extends HTMLElement>(
  strength = 10,
  enabled = true,
) {
  const ref = useRef<T>(null);

  useFrameSubscription((d) => {
    const el = ref.current;
    if (!el) return;
    if (!enabled || d.reduced || !d.pointerActive) {
      el.style.transform = "translate3d(0,0,0)";
      return;
    }
    const x = (-d.mouse.x * strength).toFixed(2);
    const y = (d.mouse.y * strength).toFixed(2);
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });

  return ref;
}

/** Raw pointer listener (used by the fallback experience and debug HUD). */
export function usePointer(enabled = true) {
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);
  return pointer;
}
