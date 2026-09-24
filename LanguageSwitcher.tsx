import { useLanguage, type LangCode } from "../locales";
import { director } from "../lib/director";

const CODES: LangCode[] = ["uz", "ru", "en"];

/** Instant, page-reload-free language switching — the 3D scene is untouched. */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, dict } = useLanguage();

  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.04] p-0.5"
      role="group"
      aria-label={dict.a11y.language}
    >
      {CODES.map((code) => {
        const active = code === lang;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={active}
            className={[
              "relative rounded-full transition-all duration-300",
              compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-[10.5px]",
              active
                ? "bg-white text-black font-bold"
                : "text-white/55 hover:text-white font-semibold",
            ].join(" ")}
            style={{ letterSpacing: "0.14em" }}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

export function scrollToProgress(p: number) {
  director.scrollToProgress(p);
}
