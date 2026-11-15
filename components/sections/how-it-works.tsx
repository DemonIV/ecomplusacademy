import { LineIcon } from "@/components/ui/line-icon";
import { COPY } from "@/content/copy";

/** The six steps (the same words as the "6 Adım" video) and the first month's rhythm. */
export function HowItWorks() {
  const { howItWorks } = COPY;
  const last = howItWorks.steps.length - 1;
  return (
    <section className="section bg-deep" aria-labelledby="how-title">
      <div className="shell">
        <h2 id="how-title" className="t-h2">
          {howItWorks.title}
        </h2>
        <p className="t-lead measure mt-4">{howItWorks.lead}</p>

        <ol className="mt-10 grid grid-cols-3 gap-2.5 md:mt-12 md:grid-cols-6 md:gap-0">
          {howItWorks.steps.map((step, i) => (
            <li
              key={step.id}
              className="relative flex flex-col items-center gap-3 rounded-2xl border border-line bg-panel/40 px-2 py-5 text-center md:rounded-none md:border-0 md:bg-transparent md:py-0"
            >
              {/* Connector to the neighbours (desktop row only). */}
              {i > 0 && <span aria-hidden="true" className="absolute left-0 top-7 hidden h-px w-1/2 bg-gold/35 md:block" />}
              {i < last && <span aria-hidden="true" className="absolute right-0 top-7 hidden h-px w-1/2 bg-gold/35 md:block" />}
              <span className="relative grid size-14 place-items-center rounded-2xl border border-gold/40 bg-night text-gold">
                <LineIcon id={step.id} />
              </span>
              <span className="leading-tight">
                <span className="t-num block text-xs text-faint">{i + 1}</span>
                <span className="mt-1 block font-semibold">{step.label}</span>
              </span>
            </li>
          ))}
        </ol>

        <ol className="mt-10 grid gap-2.5 md:mt-14 md:grid-cols-[3fr_1.4fr_2.6fr] md:gap-1.5">
          {howItWorks.weeks.map((week, i) => (
            <li key={week.when} className="rounded-2xl border border-line bg-panel/50 p-4 md:rounded-none md:first:rounded-l-2xl md:last:rounded-r-2xl">
              <span
                aria-hidden="true"
                className={`block h-1 rounded-full ${i === 0 ? "bg-gold" : i === 1 ? "bg-gold/60" : "bg-silver/40"}`}
              />
              <p className="mt-3 text-sm font-bold text-gold">{week.when}</p>
              <p className="mt-0.5 font-semibold">{week.what}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
