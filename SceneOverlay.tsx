import { memo, useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { useLanguage } from "../locales";
import { director, SCENES, useActiveProduct, useFrameSubscription } from "../lib/director";
import { useMouseParallax } from "../hooks/useMouseParallax";
import { PRODUCTS } from "../lib/products";

interface Window {
  key: string;
  enter: [number, number];
  exit: [number, number];
}

/** Each block owns a scroll window in global progress (0 – 1). */
const WINDOWS: Window[] = [
  { key: "hero", enter: [-0.06, -0.005], exit: [0.108, 0.15] },
  { key: "catalog", enter: [0.16, 0.205], exit: [0.262, 0.305] },
  { key: "featured", enter: [0.31, 0.352], exit: [0.418, 0.462] },
  { key: "features", enter: [0.465, 0.515], exit: [0.562, 0.606] },
  { key: "transitions", enter: [0.608, 0.636], exit: [0.735, 0.772] },
  { key: "story", enter: [0.772, 0.812], exit: [0.848, 0.888] },
  { key: "cta", enter: [0.892, 0.938], exit: [1.02, 1.03] },
];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const fade = (p: number, [a, b]: [number, number]) => clamp01((p - a) / (b - a || 1));

const rise = (s: number) => ({ "--s": s } as CSSProperties);

function SceneOverlayImpl() {
  const { dict, lang } = useLanguage();
  const activeProduct = useActiveProduct();
  const blocks = useRef<Record<string, HTMLDivElement | null>>({});
  const rail = useRef<HTMLDivElement>(null);
  const railPct = useRef<HTMLSpanElement>(null);
  const lastAccent = useRef("");
  const root = useRef<HTMLDivElement>(null);
  const heroParallax = useMouseParallax<HTMLDivElement>(14);

  // GSAP micro-transition whenever the language changes — instant switch,
  // no page reload, the WebGL scene is left completely untouched.
  useEffect(() => {
    if (!root.current) return;
    gsap.fromTo(
      root.current,
      { opacity: 0.3, filter: "blur(7px)" },
      { opacity: 1, filter: "blur(0px)", duration: 0.75, ease: "power3.out" },
    );
  }, [lang]);

  const setRef = (key: string) => (el: HTMLDivElement | null) => {
    blocks.current[key] = el;
  };

  useFrameSubscription((d) => {
    const p = d.progress;

    // ---- accent colour (only written when it actually changes) ---------
    const a = d.accent;
    const key = `${a[0].toFixed(2)}|${a[1].toFixed(2)}|${a[2].toFixed(2)}`;
    if (key !== lastAccent.current) {
      lastAccent.current = key;
      const css = `rgb(${Math.round(a[0] * 255)}, ${Math.round(a[1] * 255)}, ${Math.round(a[2] * 255)})`;
      document.documentElement.style.setProperty("--nx-accent", css);
    }

    // ---- block visibility ---------------------------------------------
    // `reveal` gates every block so the copy choreographs itself in with the
    // camera dolly once the loader has finished.
    const reveal = d.entered ? d.reveal : 0;
    for (const w of WINDOWS) {
      const el = blocks.current[w.key];
      if (!el) continue;
      const inT = fade(p, w.enter);
      const outT = fade(p, w.exit);
      const o = inT * (1 - outT) * reveal;
      const y = (1 - inT) * 44 - outT * 44;
      if (o <= 0.004) {
        if (el.style.visibility !== "hidden") {
          el.style.visibility = "hidden";
          el.style.opacity = "0";
        }
        continue;
      }
      el.style.visibility = "visible";
      el.style.opacity = String(o);
      el.style.setProperty("--y", `${y.toFixed(2)}px`);
    }

    // ---- progress rail -------------------------------------------------
    if (rail.current) rail.current.style.transform = `scaleY(${p.toFixed(4)})`;
    if (railPct.current) {
      railPct.current.textContent = `${String(Math.round(p * 100)).padStart(2, "0")}`;
    }
  });

  const product = PRODUCTS[activeProduct];
  const productCopy = dict.products[activeProduct];

  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {/* ============================================================ HERO */}
      <div ref={setRef("hero")} className="nx-block absolute inset-0">
        <div className="nx-scrim-bottom absolute inset-x-0 bottom-0 h-[62%] sm:h-[70%]" />
        <div
          ref={heroParallax}
          className="relative mx-auto flex h-full max-w-[1680px] flex-col justify-end px-5 pb-14 sm:px-10 sm:pb-[7vh]"
        >
          <p className="nx-kicker nx-rise mb-5 text-white/50" style={rise(1.9)}>
            {dict.hero.kicker}
          </p>
          <h1
            className="nx-display nx-rise max-w-[16ch] text-[clamp(2.1rem,7.2vw,6.1rem)] text-white"
            style={rise(1.35)}
          >
            {dict.hero.title}
          </h1>
          <p
            className="nx-body nx-rise mt-6 max-w-[46ch] text-[clamp(0.9rem,1.15vw,1.05rem)] text-white/62"
            style={rise(1)}
          >
            {dict.hero.lead}
          </p>
          <div className="nx-rise mt-9 flex flex-wrap items-center gap-x-10 gap-y-5" style={rise(0.7)}>
            {dict.hero.stats.map((s) => (
              <div key={s.label} className="flex items-baseline gap-2.5">
                <span className="font-display text-[1.35rem] font-extrabold text-white">{s.value}</span>
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.26em] text-white/40">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-6 right-5 hidden flex-col items-center gap-3 sm:right-10 md:flex">
          <span className="text-[8.5px] font-semibold uppercase tracking-[0.34em] text-white/35 [writing-mode:vertical-rl]">
            {dict.hero.scroll}
          </span>
          <span className="nx-scroll-hint relative h-12 w-[1px] bg-white/12" />
        </div>
      </div>

      {/* ========================================================== CATALOG */}
      <div ref={setRef("catalog")} className="nx-block absolute inset-0">
        <div className="nx-scrim-bottom absolute inset-x-0 bottom-0 h-[62%]" />
        <div className="relative mx-auto flex h-full max-w-[1680px] flex-col justify-between px-5 pb-12 pt-[15vh] sm:px-10">
          <div>
            <p className="nx-kicker nx-rise mb-4 text-white/45" style={rise(1.8)}>
              {dict.catalog.kicker}
            </p>
            <h2 className="nx-display nx-rise text-[clamp(1.9rem,5vw,4rem)] text-white" style={rise(1.3)}>
              {dict.catalog.title}
            </h2>
            <p className="nx-body nx-rise mt-4 max-w-[38ch] text-[0.95rem] text-white/55" style={rise(1)}>
              {dict.catalog.lead}
            </p>
          </div>

          <div className="nx-rise" style={rise(0.8)}>
            <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.34em] text-white/35">
              {dict.catalog.hint}
            </p>
            <ul className="pointer-events-auto grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {PRODUCTS.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() =>
                      director.scrollToProgress(i === 0 ? 0.365 : 0.6 + i * 0.03 + 0.006)
                    }
                    className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 text-left transition-all duration-400 hover:border-white/25 hover:bg-white/[0.06]"
                  >
                    <span
                      className="h-7 w-[3px] shrink-0 rounded-full transition-all duration-500 group-hover:h-9"
                      style={{ background: p.accent, boxShadow: `0 0 18px ${p.accent}` }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-display text-[10px] font-bold uppercase tracking-[0.14em] text-white/90">
                        {p.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-white/40">
                        {dict.products[i].flavor}
                      </span>
                    </span>
                    <span className="ml-auto font-display text-[9px] font-bold text-white/20">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================= FEATURED */}
      <div ref={setRef("featured")} className="nx-block absolute inset-0">
        <div className="nx-scrim absolute inset-0 hidden lg:block" />
        <div className="nx-scrim-bottom absolute inset-x-0 bottom-0 h-[70%] lg:hidden" />
        <div className="relative mx-auto flex h-full max-w-[1680px] items-end px-5 pb-12 sm:px-10 lg:items-center lg:pb-0">
          <div className="max-w-[520px]">
            <p className="nx-kicker nx-rise mb-4 text-white/45" style={rise(1.9)}>
              {dict.featured.kicker}
            </p>
            <h2
              className="nx-display nx-rise nx-glow-text text-[clamp(2.2rem,5.6vw,4.6rem)] text-white"
              style={{ ...rise(1.4), color: product.accent }}
            >
              {PRODUCTS[0].name}
            </h2>
            <p
              className="nx-kicker nx-rise mt-3"
              style={{ ...rise(1.25), color: `${PRODUCTS[0].accent2}` }}
            >
              {dict.products[0].flavor} · {dict.products[0].tagline}
            </p>
            <p className="nx-body nx-rise mt-5 max-w-[42ch] text-[clamp(0.95rem,1.2vw,1.1rem)] text-white/68" style={rise(1)}>
              {dict.featured.lead}
            </p>

            <dl className="nx-rise mt-8 grid grid-cols-2 gap-x-8 gap-y-5" style={rise(0.85)}>
              {dict.featured.facts.map((f) => (
                <div key={f.label} className="border-t border-white/10 pt-3">
                  <dt className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/35">
                    {f.label}
                  </dt>
                  <dd className="mt-1.5 font-display text-[0.95rem] font-semibold text-white">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="nx-rise mt-7 text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/35" style={rise(0.7)}>
              {dict.featured.note}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= FEATURES */}
      <div ref={setRef("features")} className="nx-block absolute inset-0">
        <div className="nx-scrim-bottom absolute inset-x-0 bottom-0 h-[66%]" />
        <div className="relative mx-auto flex h-full max-w-[1680px] flex-col justify-end px-5 pb-9 sm:px-10 lg:justify-between lg:pb-10 lg:pt-[13vh]">
          <div className="mx-auto max-w-[560px] text-center">
            <p className="nx-kicker nx-rise mb-4 text-white/45" style={rise(1.8)}>
              {dict.features.kicker}
            </p>
            <h2 className="nx-display nx-rise text-[clamp(1.7rem,4.2vw,3.2rem)] text-white" style={rise(1.35)}>
              {dict.features.title}
            </h2>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-0 lg:grid-cols-4 lg:items-center">
            {dict.features.items.map((item, i) => (
              <article
                key={item.label}
                className="nx-rise nx-card pointer-events-auto rounded-2xl p-4 sm:p-5"
                style={rise(0.9 - i * 0.12)}
              >
                <p className="text-[8.5px] font-bold uppercase tracking-[0.3em] text-white/40">
                  {item.label}
                </p>
                <p
                  className="mt-2.5 font-display text-[clamp(0.95rem,1.35vw,1.2rem)] font-bold leading-tight"
                  style={{ color: PRODUCTS[0].accent }}
                >
                  {item.value}
                </p>
                <p className="nx-body mt-2.5 hidden text-[11.5px] leading-relaxed text-white/50 sm:block">
                  {item.note}
                </p>
              </article>
            ))}
          </div>
          <p className="nx-rise mt-6 text-center text-[10px] uppercase tracking-[0.22em] text-white/30" style={rise(0.6)}>
            {dict.features.footnote}
          </p>
        </div>
      </div>

      {/* ===================================================== TRANSITIONS */}
      <div ref={setRef("transitions")} className="nx-block absolute inset-0">
        <div className="nx-scrim-bottom absolute inset-x-0 bottom-0 h-[72%]" />
        <div className="relative mx-auto flex h-full max-w-[1680px] flex-col items-center justify-end px-5 pb-12 text-center sm:px-10">
          <p className="nx-kicker nx-rise mb-4 text-white/45" style={rise(1.9)}>
            {dict.transitions.kicker}
          </p>
          <h2
            className="nx-display nx-glow-text text-[clamp(2rem,6vw,5rem)] text-white"
            style={{ ...rise(1.4), color: product.accent }}
          >
            {product.name}
          </h2>
          <p className="nx-kicker nx-rise mt-3" style={{ ...rise(1.25), color: product.accent2 }}>
            {productCopy.flavor} · {productCopy.tagline}
          </p>
          <p className="nx-body nx-rise mx-auto mt-5 max-w-[44ch] text-[clamp(0.9rem,1.15vw,1.05rem)] text-white/65" style={rise(1.05)}>
            {productCopy.description}
          </p>
          <div className="nx-rise mt-8 flex items-center gap-2.5" style={rise(0.8)}>
            {PRODUCTS.map((p, i) => (
              <span
                key={p.id}
                className="h-[3px] rounded-full transition-all duration-700"
                style={{
                  width: i === activeProduct ? 34 : 12,
                  background: i === activeProduct ? p.accent : "rgba(255,255,255,0.18)",
                }}
              />
            ))}
          </div>
          <p className="nx-rise mt-5 text-[9px] font-semibold uppercase tracking-[0.3em] text-white/28" style={rise(0.65)}>
            {dict.transitions.hint} ↓
          </p>
        </div>
      </div>

      {/* ============================================================ STORY */}
      <div ref={setRef("story")} className="nx-block absolute inset-0">
        <div className="nx-scrim absolute inset-0" />
        <div className="relative mx-auto flex h-full max-w-[1680px] items-end px-5 pb-14 sm:px-10 lg:items-center lg:pb-0">
          <div className="max-w-[520px]">
            <p className="nx-kicker nx-rise mb-4 text-white/45" style={rise(1.9)}>
              {dict.story.kicker}
            </p>
            <h2 className="nx-display nx-rise text-[clamp(1.9rem,5vw,4rem)] text-white" style={rise(1.4)}>
              {dict.story.title}
            </h2>
            {dict.story.body.map((para, i) => (
              <p
                key={i}
                className="nx-body nx-rise mt-5 max-w-[44ch] text-[clamp(0.9rem,1.1vw,1rem)] text-white/60"
                style={rise(1.05 - i * 0.12)}
              >
                {para}
              </p>
            ))}
            <div className="nx-rise mt-9 flex flex-wrap gap-x-10 gap-y-4" style={rise(0.8)}>
              {dict.story.stats.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-[1.4rem] font-extrabold text-white">{s.value}</div>
                  <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.26em] text-white/38">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== CTA */}
      <div ref={setRef("cta")} className="nx-block absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(58% 46% at 50% 62%, rgba(4,5,9,0.62) 0%, rgba(4,5,9,0.24) 45%, transparent 75%)",
          }}
        />
        <div className="nx-scrim-bottom absolute inset-x-0 bottom-0 h-[52%]" />
        <div className="relative mx-auto flex h-full max-w-[1680px] flex-col items-center justify-end px-5 pb-11 text-center sm:px-10 lg:justify-center lg:pb-0">
          <p className="nx-kicker nx-rise mb-5 text-white/45" style={rise(1.9)}>
            {dict.cta.kicker}
          </p>
          <h2 className="nx-display nx-rise nx-glow-text text-[clamp(2.3rem,7vw,5.6rem)] text-white" style={rise(1.4)}>
            {dict.cta.title}
          </h2>
          <p className="nx-body nx-rise mt-5 text-[clamp(0.95rem,1.2vw,1.1rem)] text-white/62" style={rise(1.1)}>
            {dict.cta.lead}
          </p>
          <div className="nx-rise pointer-events-auto mt-9 flex flex-col items-center gap-3.5 sm:flex-row" style={rise(0.85)}>
            <a href="#flavors" className="nx-btn nx-btn-primary" onClick={(e) => { e.preventDefault(); director.scrollToProgress(0.6); }}>
              {dict.cta.button}
            </a>
            <a href="#buy" className="nx-btn">
              {dict.cta.secondary}
            </a>
          </div>
          <div className="nx-rise pointer-events-auto mt-8 hidden flex-wrap justify-center gap-2 sm:mt-11 sm:flex" style={rise(0.7)}>
            {PRODUCTS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className="nx-pill"
                data-active={i === activeProduct}
                onClick={() => director.scrollToProgress(i === 0 ? 0.365 : 0.6 + i * 0.03 + 0.006)}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.accent }} />
                {p.name}
              </button>
            ))}
          </div>
          <p className="nx-rise mt-8 text-[9.5px] uppercase tracking-[0.26em] text-white/28" style={rise(0.55)}>
            {dict.cta.note}
          </p>
        </div>
      </div>

      {/* ======================================================= PROGRESS RAIL */}
      <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex lg:right-7">
        <div className="relative h-[190px] w-[2px] overflow-hidden bg-white/10">
          <div
            ref={rail}
            className="absolute inset-x-0 top-0 h-full origin-top"
            style={{ background: "linear-gradient(to bottom, #fff, var(--nx-accent))" }}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          {SCENES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-label={s.id}
              onClick={() => director.scrollToProgress(s.start + 0.004)}
              className="pointer-events-auto h-[7px] w-[7px] rounded-full border border-white/25 transition-all duration-500 hover:border-white hover:bg-white"
            />
          ))}
        </div>
        <span
          ref={railPct}
          className="font-display text-[9px] font-bold tracking-[0.1em] text-white/40 tabular-nums"
        >
          00
        </span>
      </div>

      {/* screen-reader / SEO content */}
      <div className="sr-only">
        <h1>NEXO ENERGY</h1>
        {dict.products.map((p) => (
          <p key={p.name}>
            {p.name} — {p.flavor}. {p.description}
          </p>
        ))}
      </div>
    </div>
  );
}

/** Memoised: it only re-renders on language / active-product changes. */
export const SceneOverlay = memo(SceneOverlayImpl);
