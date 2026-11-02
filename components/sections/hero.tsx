import Image from "next/image";
import { HeroGlobe } from "@/components/three/globe/hero-globe";
import { GlobeFallback } from "@/components/three/globe/globe-fallback";
import { LineIcon } from "@/components/ui/line-icon";
import { VslPlayer } from "@/components/video/vsl-player";
import { BRAND } from "@/content/brand";
import { COPY } from "@/content/copy";
import { MEDIA } from "@/content/media";
import { SITE } from "@/config/site";

const CARD_POSITIONS = [
  "flex left-[4%] top-[20%] lg:left-[-6%] lg:top-[22%]",
  "flex right-[3%] top-[34%] lg:right-[-4%] lg:top-[40%]",
  "hidden lg:flex lg:left-[6%] lg:top-[72%]",
];

/** Keeps hyphenated words ("E-ticaretle") on one line in the display headline. */
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
  const last = hero.title.length - 1;
  return (
    <section className="relative overflow-hidden pt-[calc(var(--header-h)+2rem)] lg:pt-[calc(var(--header-h)+3.5rem)]">
      <div className="ambient" />
      <div className="shell relative grid items-center gap-y-2 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] lg:gap-x-10">
        {/* The copy paints at once, with no entrance animation; only the globe and its cards move. */}
        <div className="relative z-10 max-w-[38rem] pt-2 lg:pb-16">
          <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-line-strong bg-panel/60 px-3.5 py-1.5 text-sm font-semibold text-silver">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-gold [animation:ping-soft_2.4s_ease-out_infinite]" />
              <span className="relative inline-flex size-2 rounded-full bg-gold" />
            </span>
            {SITE.cohortLabel}
          </p>
          {/* On short laptop screens the headline also shrinks with the height, so the CTA stays on the first screen. */}
          <h1 className="t-display text-[clamp(2rem,1.15rem+2.9vw,3.75rem)] lg:text-[length:min(3.75rem,4.2vw,7svh)]">
            {hero.title.map((sentence, i) => (
              <span key={sentence} className={`block ${i === last ? "text-gold" : ""}`}>
                {keepHyphenated(sentence)}
              </span>
            ))}
          </h1>
          <p className="t-lead measure mt-6">{hero.lead}</p>
          <a href="#basvuru" className="btn btn-gold mt-8 w-full sm:w-auto" data-hero-cta>
            {hero.cta}
          </a>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5 text-[0.95rem] font-semibold">
            {hero.trust.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="grid size-5 flex-none place-items-center rounded-full bg-gold/15 text-gold">
                  <LineIcon id="check" className="size-3.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 flex items-center gap-3 text-[0.95rem] leading-snug text-muted">
            <Image
              src={MEDIA.founder.avatar.src}
              alt=""
              width={40}
              height={40}
              loading="eager"
              className="size-10 flex-none rounded-full border border-line-strong object-cover"
            />
            <span>
              <span className="font-semibold text-paper">{BRAND.founder.name}</span> · {BRAND.founder.proof}
            </span>
          </p>
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

      <div className="shell relative z-10 -mt-14 pb-[calc(var(--section-space)*0.45)] lg:-mt-6">
        <div className="mx-auto max-w-[1000px]">
          <VslPlayer
            source={MEDIA.vsl}
            title="Onur Yeşil'den tanıtım videosu"
            labels={{ unmute: vsl.unmute, restart: vsl.restart, play: vsl.play, ended: vsl.ended, cta: hero.cta }}
          />
          <p className="t-lead measure mx-auto mt-7 text-center">{vsl.caption}</p>
        </div>
      </div>
    </section>
  );
}
