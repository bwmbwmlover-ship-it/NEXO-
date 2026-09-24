import heroImage from "../assets/fallback-hero.jpg";
import { useLanguage } from "../locales";
import { PRODUCTS } from "../lib/products";

/**
 * Premium static experience used when WebGL is unavailable. Same brand,
 * same content, same three languages — nothing is broken or blank.
 */
export function StaticFallback({ onRetry }: { onRetry?: () => void }) {
  const { dict } = useLanguage();

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto bg-[#05060a]">
      <section className="relative flex min-h-full flex-col justify-end px-6 pb-14 pt-32 sm:px-12">
        <div className="pointer-events-none absolute inset-0">
          <img
            src={heroImage}
            alt="NEXO ENERGY can lineup"
            className="h-full w-full object-cover"
            style={{ opacity: 0.72 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05060a] via-[#05060a]/55 to-[#05060a]/85" />
        </div>

        <div className="relative max-w-3xl">
          <p className="nx-kicker mb-5 text-white/50">{dict.hero.kicker}</p>
          <h1 className="nx-display text-[clamp(2.2rem,7vw,5.4rem)] text-white">
            {dict.hero.title}
          </h1>
          <p className="nx-body mt-6 max-w-[52ch] text-white/65">{dict.hero.lead}</p>

          <div className="mt-9 flex flex-wrap gap-x-10 gap-y-5">
            {dict.hero.stats.map((s) => (
              <div key={s.label} className="flex items-baseline gap-2.5">
                <span className="font-display text-[1.3rem] font-extrabold text-white">
                  {s.value}
                </span>
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.26em] text-white/40">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-[46ch] rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[12px] leading-relaxed text-white/45">
            {dict.fallback.note}
          </p>
        </div>
      </section>

      <section className="border-t border-white/[0.07] bg-[#05060a] px-6 py-16 sm:px-12">
        <p className="nx-kicker mb-4 text-white/45">{dict.catalog.kicker}</p>
        <h2 className="nx-display text-[clamp(1.6rem,4vw,2.8rem)] text-white">
          {dict.catalog.title}
        </h2>

        <ul className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p, i) => (
            <li
              key={p.id}
              className="nx-card relative overflow-hidden rounded-2xl p-5"
              style={{ borderColor: `${p.accent}33` }}
            >
              <span
                className="absolute inset-x-0 top-0 h-[2px]"
                style={{ background: p.accent }}
              />
              <span className="flex items-center justify-between">
                <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                  {p.name}
                </span>
                <span className="font-display text-[9px] font-bold text-white/25">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </span>
              <span className="mt-2 block text-[11px] uppercase tracking-[0.18em]" style={{ color: p.accent }}>
                {dict.products[i].flavor}
              </span>
              <span className="nx-body mt-3 block text-[12px] text-white/55">
                {dict.products[i].description}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-white/[0.07] px-6 py-16 text-center sm:px-12">
        <h2 className="nx-display text-[clamp(1.6rem,4.6vw,3.2rem)] text-white">
          {dict.cta.title}
        </h2>
        <p className="nx-body mx-auto mt-4 max-w-[40ch] text-white/55">{dict.cta.lead}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button type="button" className="nx-btn nx-btn-primary" onClick={onRetry}>
            {dict.fallback.retry}
          </button>
          <button type="button" className="nx-btn">
            {dict.cta.secondary}
          </button>
        </div>
      </section>
    </div>
  );
}
