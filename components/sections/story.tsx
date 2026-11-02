import Image from "next/image";
import { FounderTimeline } from "@/components/sections/founder-timeline";
import { BRAND } from "@/content/brand";
import { COPY } from "@/content/copy";
import { MEDIA } from "@/content/media";

/** Onur's story: the page's main proof while there are no student results yet. */
export function Story() {
  const { story } = COPY;
  const [first, second, ...rest] = story.paragraphs;
  const portrait = MEDIA.founder.portrait;
  return (
    <section className="section" aria-labelledby="story-title">
      <div className="shell">
        <div className="grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start lg:gap-x-16">
          <h2 id="story-title" className="t-h2 lg:col-start-2 lg:row-start-1">
            {story.title}
          </h2>
          <figure className="relative mt-8 max-w-[28rem] overflow-hidden rounded-[var(--radius-card)] border border-line-strong bg-panel lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:max-w-none">
            <Image
              src={portrait.src}
              alt={portrait.alt}
              placeholder="blur"
              sizes="(min-width: 1024px) 440px, (min-width: 640px) 448px, 100vw"
              className="aspect-[4/5] h-auto w-full object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 via-night/55 to-transparent px-5 pb-5 pt-20">
              <p className="font-display text-lg font-medium">{BRAND.founder.name}</p>
              <p className="text-sm text-silver">{BRAND.founder.title}</p>
            </figcaption>
          </figure>
          <div className="measure mt-8 space-y-5 text-[1.08rem] text-muted lg:col-start-2 lg:row-start-2 lg:mt-7">
            <p>{first}</p>
            <p>{second}</p>
            <blockquote className="border-l-2 border-gold py-1 pl-5 font-display text-[clamp(1.2rem,1.05rem+0.7vw,1.5rem)] font-medium leading-snug text-paper">
              “{story.quote}”
            </blockquote>
            {rest.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
        </div>

        <FounderTimeline milestones={story.milestones} />
      </div>
    </section>
  );
}
