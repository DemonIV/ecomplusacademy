import Image from "next/image";
import { LineIcon } from "@/components/ui/line-icon";
import { BRAND } from "@/content/brand";
import { COPY } from "@/content/copy";
import { MEDIA } from "@/content/media";
import { COHORT } from "@/config/site";

/**
 * The page's main proof, right under the video: the team's numbers, the head
 * mentor, the founder who takes the free call, and the month's seats. Seat
 * numbers come from config/site.ts and are real; "N yer kaldı" appears only
 * once someone has joined.
 */
export function Mentor() {
  const { mentor } = COPY;
  const { month, seats, taken } = COHORT;
  const left = Math.max(0, seats - taken);
  const percent = Math.min(100, Math.round((taken / seats) * 100));
  const portrait = MEDIA.mentor.portrait;
  const founder = MEDIA.founder.avatar;
  return (
    <section className="section pt-[calc(var(--section-space)*0.45)]" aria-labelledby="mentor-title">
      <div className="shell">
        {/* Value above its label; the label stays the <dt> for screen readers. */}
        <dl className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
          {mentor.stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col-reverse justify-end rounded-[var(--radius-card)] border border-line bg-panel/50 px-4 py-5 sm:p-6"
            >
              <dt className="mt-1.5 text-[0.92rem] leading-snug text-muted">{stat.label}</dt>
              <dd className="t-num text-[1.3rem] leading-tight text-gold sm:text-[1.6rem]">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 grid gap-8 lg:mt-16 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-x-16">
          <figure className="relative max-w-[28rem] overflow-hidden rounded-[var(--radius-card)] border border-line-strong bg-panel lg:max-w-none">
            <Image
              src={portrait.src}
              alt={portrait.alt}
              placeholder="blur"
              sizes="(min-width: 1024px) 440px, (min-width: 640px) 448px, 100vw"
              className="aspect-[4/5] h-auto w-full object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 via-night/55 to-transparent px-5 pb-5 pt-20">
              <p className="font-display text-lg font-medium">{BRAND.mentor.name}</p>
              <p className="text-sm text-silver">{BRAND.mentor.title}</p>
            </figcaption>
          </figure>

          <div>
            <p className="text-sm font-bold text-gold">{mentor.eyebrow}</p>
            <h2 id="mentor-title" className="t-h2 mt-3">
              {BRAND.mentor.name}
            </h2>
            <p className="t-lead measure mt-5">{mentor.lead}</p>
            <p className="mt-7 font-semibold">{mentor.pointsTitle}</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {mentor.points.map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <span className="mt-1 grid size-5 flex-none place-items-center rounded-full bg-gold/15 text-gold">
                    <LineIcon id="check" className="size-3.5" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-start gap-4 rounded-[var(--radius-card)] border border-line-strong bg-panel/60 p-5">
              <Image
                src={founder.src}
                alt={founder.alt}
                width={56}
                height={56}
                className="size-14 flex-none rounded-2xl border border-line-strong object-cover"
              />
              <div>
                <p className="font-semibold">
                  {BRAND.founder.name} <span className="font-normal text-muted">· {BRAND.founder.title}</span>
                </p>
                <p className="mt-1.5 text-[0.98rem] text-muted">{mentor.founderText}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="panel relative mt-10 overflow-hidden px-6 py-8 sm:px-10 sm:py-10 lg:mt-16">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div>
              <p className="t-num text-[clamp(1.6rem,1.3rem+1.2vw,2.25rem)] leading-tight text-gold">
                {mentor.capacity(month, seats)}
              </p>
              <p className="mt-3 max-w-[46ch] text-muted">{mentor.capacityText(seats)}</p>
              {taken > 0 && (
                <>
                  <div
                    className="mt-5 h-2.5 overflow-hidden rounded-full bg-night"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={seats}
                    aria-valuenow={taken}
                    aria-label={mentor.left(left, seats)}
                  >
                    <div className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-2.5 text-sm font-semibold text-paper">{mentor.left(left, seats)}</p>
                </>
              )}
            </div>
            <a href="#basvuru" className="btn btn-gold w-full flex-none sm:w-auto">
              {mentor.cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
