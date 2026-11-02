import { HeroGlobe } from "@/components/three/globe/hero-globe";
import { GlobeFallback } from "@/components/three/globe/globe-fallback";
import { VslPlayer } from "@/components/video/vsl-player";
import { COPY } from "@/content/copy";
import { MEDIA } from "@/content/media";
import { SITE } from "@/config/site";

const CARD_POSITIONS = [
  "flex left-[4%] top-[20%] lg:left-[-6%] lg:top-[22%]",
  "flex right-[3%] top-[34%] lg:right-[-4%] lg:top-[40%]",
  "hidden lg:flex lg:left-[6%] lg:top-[72%]",
];

/** Keeps hyphenated words ("e-ticaret") on one line in the display headline. */
function keepHyphenated(text: string) {
  return text.split(/(\S+-\S+)/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function ParcelGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" strokeLinejoin="round" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" strokeLinejoin="round" />
    </svg>
  );
}

export function Hero() {
  const { hero, vsl } = COPY;
  return (
    <section className="relative overflow-hidden pt-[calc(var(--header-h)+2.25rem)] lg:pt-[calc(var(--header-h)+3.5rem)]">
      <div className="ambient" />
      <div className="shell relative grid items-center gap-y-2 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] lg:gap-x-10">
        <div className="hero-in relative z-10 max-w-[38rem] pt-2 lg:pb-16">
          <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-panel/60 px-3.5 py-1.5 text-sm font-semibold text-silver">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-gold [animation:ping-soft_2.4s_ease-out_infinite]" />
              <span className="relative inline-flex size-2 rounded-full bg-gold" />
            </span>
            {SITE.cohortLabel}
          </p>
          <h1 className="t-display">{keepHyphenated(hero.title)}</h1>
          <p className="t-lead measure mt-6">{hero.lead}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href="#basvuru" className="btn btn-gold" data-hero-cta>
              {hero.cta}
            </a>
            <span className="text-[0.95rem] text-muted">{hero.ctaNote}</span>
          </div>
        </div>

        {/* Globe: a cropped horizon on phones, the full sphere beside the copy on desktop. */}
        <div className="relative -mx-[var(--gutter)] h-[64vw] max-h-[440px] overflow-hidden lg:mx-0 lg:h-auto lg:max-h-none lg:overflow-visible">
          <div className="relative left-1/2 aspect-square w-[120vw] max-w-[680px] -translate-x-1/2 lg:w-[112%]">
            <HeroGlobe fallback={<GlobeFallback />} className="absolute inset-0" />
            {hero.orderCards.map((card, i) => (
              <div
                key={card.city}
                className={`glass absolute z-10 items-start gap-3 rounded-2xl px-3.5 py-3 shadow-xl shadow-black/40 [animation:rise-in_700ms_cubic-bezier(.2,.8,.2,1)_both] ${CARD_POSITIONS[i]}`}
                style={{ animationDelay: `${900 + i * 260}ms` }}
              >
                <span className="mt-0.5 grid size-8 flex-none place-items-center rounded-lg bg-kraft/20 text-kraft">
                  <ParcelGlyph />
                </span>
                <span className="leading-tight">
                  <span className="block text-[0.78rem] font-bold text-gold">{card.status}</span>
                  <span className="mt-1 block text-[0.9rem] font-semibold">{card.product}</span>
                  <span className="mt-0.5 block text-[0.8rem] text-muted">{card.city}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="shell relative z-10 -mt-14 pb-[calc(var(--section-space)*0.6)] lg:-mt-6">
        <div className="mx-auto max-w-[1000px]">
          <VslPlayer
            source={MEDIA.vsl}
            title="Tanıtım videosu"
            labels={{ unmute: vsl.unmute, restart: vsl.restart, play: vsl.play, ended: vsl.ended, cta: hero.cta }}
          />
          <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-start">
            <p className="t-lead measure">{vsl.caption}</p>
            <figure className="relative border-l-2 border-gold pl-5">
              <blockquote className="text-[1.05rem] leading-relaxed text-paper">“{hero.featured.quote}”</blockquote>
              <figcaption className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="font-semibold text-paper">{hero.featured.name}</span>
                <span>{hero.featured.detail}</span>
                {hero.featured.sample && <span className="sample-badge">Örnek yorum</span>}
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
