import { COPY } from "@/content/copy";
import { SITE } from "@/config/site";

/** Real seat count from config — never an invented countdown. */
export function Capacity() {
  const { capacity } = COPY;
  const { total, taken, label, sample } = SITE.capacity;
  const left = Math.max(0, total - taken);
  const percent = Math.min(100, Math.round((taken / total) * 100));
  return (
    <section className="section" aria-labelledby="capacity-title">
      <div className="shell">
        <div className="panel relative overflow-hidden px-6 py-10 sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
            <div>
              <h2 id="capacity-title" className="t-h2">
                {capacity.title}
              </h2>
              <p className="t-lead measure mt-5">{capacity.text}</p>
              <a href="#basvuru" className="btn btn-gold mt-8">
                {capacity.cta}
              </a>
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-semibold">{label}</p>
                {sample && <span className="sample-badge">Örnek sayı</span>}
              </div>
              <p className="mt-3 flex items-baseline gap-3">
                <span className="t-num text-[clamp(3rem,2.4rem+2.6vw,4.6rem)] leading-none text-gold">{left}</span>
                <span className="text-muted">kişilik yer kaldı</span>
              </p>
              <div
                className="mt-5 h-3 overflow-hidden rounded-full bg-night"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={taken}
                aria-label={`${total} kişilik kontenjanın ${taken} kişisi doldu`}
              >
                <div className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-3 text-sm text-faint">
                {total} kişilik kontenjanın {taken} kişisi doldu
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
