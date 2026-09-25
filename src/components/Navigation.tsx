import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useLanguage } from "../locales";
import { director, useFrameSubscription, useSceneIndex } from "../lib/director";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navigation() {
  const { dict } = useLanguage();
  const sceneIndex = useSceneIndex();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const solidRef = useRef(false);
  const header = useRef<HTMLElement>(null);

  // GSAP entrance — the chrome settles in above the 3D stage.
  useEffect(() => {
    if (!header.current) return;
    gsap.fromTo(
      header.current,
      { yPercent: -110, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 1.1, delay: 0.25, ease: "power3.out" },
    );
  }, []);

  // Scroll state is read imperatively — no per-frame react renders.
  useFrameSubscription((d) => {
    const next = d.progress > 0.012;
    if (next !== solidRef.current) {
      solidRef.current = next;
      setSolid(next);
    }
  });

  const items = [
    { label: dict.nav.home, progress: 0, scene: 0 },
    { label: dict.nav.flavors, progress: 0.15, scene: 1 },
    { label: dict.nav.products, progress: 0.31, scene: 2 },
    { label: dict.nav.about, progress: 0.755, scene: 5 },
    { label: dict.nav.contact, progress: 0.985, scene: 6 },
  ];

  const go = (progress: number) => {
    director.scrollToProgress(progress);
    setOpen(false);
  };

  return (
    <header
      ref={header}
      className={[
        "fixed inset-x-0 top-0 z-40 transition-all duration-700",
        solid
          ? "border-b border-white/[0.07] bg-[#05060a]/70 backdrop-blur-xl"
          : "border-b border-transparent",
      ].join(" ")}
    >
      <nav
        className="mx-auto flex h-[68px] max-w-[1680px] items-center justify-between gap-6 px-5 sm:px-8"
        aria-label="Primary"
      >
        <button
          type="button"
          onClick={() => go(0)}
          className="group flex items-center gap-3"
          aria-label="NEXO ENERGY — home"
        >
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span className="absolute inset-0 rounded-[10px] bg-gradient-to-br from-white/90 to-white/25 opacity-90 transition-transform duration-500 group-hover:rotate-[18deg]" />
            <span className="relative font-display text-[13px] font-extrabold text-black">N</span>
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[13.5px] font-extrabold tracking-[0.3em] text-white">
              NEXO
            </span>
            <span className="mt-[3px] text-[8px] font-semibold tracking-[0.42em] text-white/40">
              ENERGY
            </span>
          </span>
        </button>

        <ul className="hidden items-center gap-8 lg:flex">
          {items.map((item) => {
            const active = sceneIndex === item.scene;
            return (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => go(item.progress)}
                  className="group relative py-2 text-[10.5px] font-semibold uppercase tracking-[0.24em] transition-colors duration-300"
                  style={{ color: active ? "#fff" : "rgba(244,242,239,0.55)" }}
                >
                  {item.label}
                  <span
                    className="absolute -bottom-0.5 left-0 h-[1.5px] bg-white transition-all duration-500"
                    style={{ width: active ? "100%" : "0%", opacity: active ? 1 : 0.35 }}
                  />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => go(0.985)}
            className="nx-btn nx-btn-primary hidden !px-6 !py-[0.72rem] !text-[10px] sm:inline-flex"
          >
            {dict.nav.cta}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.12] lg:hidden"
          >
            <span className="relative block h-[9px] w-[16px]">
              <span
                className="absolute left-0 h-[1.5px] w-full bg-white transition-all duration-300"
                style={{ top: open ? 4 : 0, transform: open ? "rotate(45deg)" : "none" }}
              />
              <span
                className="absolute left-0 h-[1.5px] w-full bg-white transition-all duration-300"
                style={{ top: open ? 4 : 8, transform: open ? "rotate(-45deg)" : "none" }}
              />
            </span>
          </button>
        </div>
      </nav>

      <div
        className="overflow-hidden border-t border-white/[0.06] bg-[#05060a]/95 backdrop-blur-xl transition-[max-height,opacity] duration-500 lg:hidden"
        style={{ maxHeight: open ? 420 : 0, opacity: open ? 1 : 0 }}
      >
        <ul className="flex flex-col gap-1 px-6 py-5">
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => go(item.progress)}
                className="w-full border-b border-white/[0.06] py-3.5 text-left font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-white/75"
              >
                {item.label}
              </button>
            </li>
          ))}
          <li className="pt-4">
            <button
              type="button"
              onClick={() => go(0.985)}
              className="nx-btn nx-btn-primary w-full"
            >
              {dict.nav.cta}
            </button>
          </li>
        </ul>
      </div>
    </header>
  );
}
