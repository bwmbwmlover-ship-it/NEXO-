import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Lenis from "lenis";
import { director } from "./lib/director";
import { LanguageProvider, useLanguage } from "./locales";
import { usePrefersReducedMotion } from "./hooks/useResponsive3D";
import { Experience } from "./three/Experience";
import { Navigation } from "./components/Navigation";
import { SceneOverlay } from "./components/SceneOverlay";
import { LoadingScreen } from "./components/LoadingScreen";
import { StaticFallback } from "./components/StaticFallback";
import { prepareLabelTextures } from "./three/textures";
import { PRODUCTS } from "./lib/products";

/** Total scroll length — 1000vh keeps every scene comfortably paced. */
const SCROLL_VH = 1000;

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

function Site() {
  const { dict } = useLanguage();
  const reduced = usePrefersReducedMotion();
  const [webgl] = useState(() => detectWebGL());
  const [progress, setProgress] = useState(0);
  const [assetsDone, setAssetsDone] = useState(false);
  const [glReady, setGlReady] = useState(false);
  const [entered, setEntered] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  // ---- smooth scroll ------------------------------------------------------
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    director.attachSeek((y, immediate) => {
      lenis.scrollTo(y, {
        immediate: !!immediate,
        duration: immediate ? 0 : 1.5,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
      });
    });

    // always start the story from the top
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    lenis.scrollTo(0, { immediate: true });

    const measure = () =>
      director.setScrollMetrics(
        Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
      );
    measure();
    window.addEventListener("resize", measure);

    director.start();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      director.attachSeek(null);
      director.stop();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // reduced motion → near-instant lenis response
  useEffect(() => {
    const lenis = lenisRef.current;
    if (lenis) lenis.options.lerp = reduced ? 1 : 0.085;
  }, [reduced]);

  // lock scrolling while the loader is on screen (static fallback scrolls itself)
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (entered || !webgl) lenis.start();
    else lenis.stop();
  }, [entered, webgl]);

  // ---- asset preparation (fonts + procedural can labels) ------------------
  useEffect(() => {
    let alive = true;
    (async () => {
      setProgress(0.04);
      await prepareLabelTextures((ratio) => {
        if (alive) setProgress(0.06 + ratio * 0.76);
      });
      if (!alive) return;
      setAssetsDone(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ---- final ramp once WebGL has painted a frame --------------------------
  useEffect(() => {
    if (!assetsDone || !glReady) return;
    let p = 0.88;
    setProgress(0.88);
    const id = window.setInterval(() => {
      p += 0.03;
      setProgress(Math.min(1, p));
      if (p >= 1) window.clearInterval(id);
    }, 22);
    const timeout = window.setTimeout(() => setProgress(1), 1400);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(timeout);
    };
  }, [assetsDone, glReady]);

  // ---- failsafe: never trap the visitor on the loader ---------------------
  useEffect(() => {
    const failsafe = window.setTimeout(() => {
      setAssetsDone(true);
      setGlReady(true);
      setProgress(1);
    }, 7000);
    return () => window.clearTimeout(failsafe);
  }, []);

  const onComplete = useMemo(
    () => () => {
      director.enter();
      setEntered(true);
    },
    [],
  );

  const handleFirstFrame = useCallback(() => setGlReady(true), []);

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-5 focus:py-2 focus:font-display focus:text-[11px] focus:font-bold focus:tracking-[0.2em] focus:text-black"
      >
        {dict.a11y.skip}
      </a>

      {/* scroll driver */}
      <div
        aria-hidden
        className="pointer-events-none relative z-0 w-full"
        style={{ height: `${SCROLL_VH}vh` }}
      />

      {/* WebGL stage */}
      <div
        className="fixed inset-0 z-0"
        style={{
          opacity: entered ? 1 : 0,
          transition: "opacity 1200ms cubic-bezier(0.16,1,0.3,1)",
          pointerEvents: "none",
        }}
      >
        {webgl ? <Experience onFirstFrame={handleFirstFrame} /> : null}
      </div>

      {/* cinematic film treatment */}
      <div className="nx-vignette pointer-events-none fixed inset-0 z-10 opacity-70" />
      <div className="nx-grain pointer-events-none fixed inset-0 z-10 opacity-[0.22]" />

      <div id="content">
        {webgl ? (
          <SceneOverlay />
        ) : (
          <StaticFallback onRetry={() => window.location.reload()} />
        )}
      </div>

      <Navigation />

      {webgl ? (
        <LoadingScreen progress={progress} onComplete={onComplete} />
      ) : null}

      {/* static, crawlable product index */}
      <div className="sr-only">
        <ul>
          {PRODUCTS.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Site />
    </LanguageProvider>
  );
}
