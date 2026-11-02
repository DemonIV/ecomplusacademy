import Image from "next/image";
import { BRAND } from "@/content/brand";
import { COPY } from "@/content/copy";
import { MEDIA } from "@/content/media";
import { COHORT } from "@/config/site";

/**
 * First-cohort proof instead of student reviews: the founder coaches in
 * person, so seats are few. Seat numbers come from config/site.ts and are
 * real; "N yer kaldı" appears only once someone has joined.
 */
export function Coach() {
  const { coach } = COPY;
  const { month, seats, taken } = COHORT;
  const left = Math.max(0, seats - taken);
  const percent = Math.min(100, Math.round((taken / seats) * 100));
  return (
    <section className="section" aria-labelledby="coach-title">
      <div className="shell">
        <div className="panel relative overflow-hidden px-6 py-10 sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <Image
                src={MEDIA.founder.avatar.src}
                alt={MEDIA.founder.avatar.alt}
                width={112}
                height={112}
                placeholder="blur"
                className="size-24 flex-none rounded-[24px] border border-line-strong object-cover sm:size-28"
              />
              <div>
                <h2 id="coach-title" className="t-h2">
                  {coach.title(month)}
                </h2>
                <p className="t-lead mt-4">{coach.text}</p>
                <p className="mt-4 text-sm text-muted">
                  <span className="font-semibold text-paper">{BRAND.founder.name}</span> · {BRAND.founder.title}
                </p>
              </div>
            </div>

            <div className="rounded-[var(--radius-card)] border border-line-strong bg-night/50 p-6 sm:p-8">
              <p className="t-num text-[clamp(1.6rem,1.3rem+1.2vw,2.25rem)] leading-tight text-gold">
                {coach.capacity(month, seats)}
              </p>
              <p className="mt-3 text-muted">{coach.capacityText}</p>
              {taken > 0 && (
                <>
                  <div
                    className="mt-5 h-2.5 overflow-hidden rounded-full bg-night"
                    role="meter"
                    aria-valuemin={0}
                    aria-valuemax={seats}
                    aria-valuenow={taken}
                    aria-label={coach.left(left, seats)}
                  >
                    <div className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-2.5 text-sm font-semibold text-paper">{coach.left(left, seats)}</p>
                </>
              )}
              <a href="#basvuru" className="btn btn-gold mt-6 w-full sm:w-auto">
                {coach.cta}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
