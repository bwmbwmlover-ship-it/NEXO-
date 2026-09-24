import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../locales";
import { director, useFrameSubscription } from "../lib/director";

interface LoadingScreenProps {
  progress: number;
  onComplete: () => void;
}

export function LoadingScreen({ progress, onComplete }: LoadingScreenProps) {
  const { dict } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const done = useRef(false);

  // The counter and bar are driven imperatively so the loader itself never
  // re-renders while the numbers are ticking up.
  useFrameSubscription(() => {
    if (done.current) return;
    const pct = Math.round(director.loadProgress * 100);
    if (counter.current) counter.current.textContent = String(pct).padStart(3, "0");
    if (bar.current) bar.current.style.transform = `scaleX(${director.loadProgress})`;
    if (director.loadProgress >= 1) {
      done.current = true;
      setTimeout(() => {
        setVisible(false);
        onComplete();
        setTimeout(() => setMounted(false), 1100);
      }, 420);
    }
  });

  useEffect(() => {
    director.setLoad(progress);
  }, [progress]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#05060a] transition-opacity duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
      aria-live="polite"
      aria-busy={visible}
    >
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 55%, color-mix(in srgb, var(--nx-accent) 16%, transparent) 0%, transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 nx-grain" />

      <div className="relative flex flex-col items-center px-8">
        <div
          className="mb-7 flex h-[74px] w-[74px] items-center justify-center rounded-[22px] border border-white/10"
          style={{
            background:
              "linear-gradient(150deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))",
            boxShadow: "0 24px 80px -30px color-mix(in srgb, var(--nx-accent) 70%, transparent)",
          }}
        >
          <span className="font-display text-2xl font-extrabold text-white">N</span>
        </div>

        <h1 className="font-display text-[clamp(22px,4.4vw,42px)] font-extrabold tracking-[0.34em] text-white">
          {dict.loader.brand.split(" ")[0]}
          <span className="ml-[0.34em] text-white/40">ENERGY</span>
        </h1>
        <p className="nx-kicker mt-4 text-white/35">{dict.loader.sub}</p>

        <div className="mt-12 w-[min(420px,72vw)]">
          <div className="relative h-[2px] w-full overflow-hidden bg-white/10">
            <div
              ref={bar}
              className="absolute inset-0 origin-left"
              style={{
                transform: "scaleX(0)",
                background:
                  "linear-gradient(90deg, color-mix(in srgb, var(--nx-accent) 30%, #fff), var(--nx-accent))",
              }}
            />
          </div>
          <div className="mt-4 flex items-baseline justify-between font-display">
            <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/35">
              {dict.loader.loading}
            </span>
            <span className="text-[13px] font-bold tracking-[0.14em] text-white/80 tabular-nums">
              <span ref={counter}>000</span>
              <span className="text-white/35">%</span>
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.34em] text-white/25">
        <span>UZ</span>
        <span className="h-[3px] w-[3px] rounded-full bg-white/25" />
        <span>RU</span>
        <span className="h-[3px] w-[3px] rounded-full bg-white/25" />
        <span>EN</span>
      </div>
    </div>
  );
}
