import { ApplyFlow } from "@/components/apply/apply-flow";
import { COPY } from "@/content/copy";

export function Apply() {
  const { apply } = COPY;
  return (
    <section id="basvuru" className="section scroll-mt-[var(--header-h)] bg-deep" aria-labelledby="apply-title">
      <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <div>
          <h2 id="apply-title" className="t-h2">
            {apply.title}
          </h2>
          <ol className="mt-10 space-y-6">
            {apply.steps.map((step, i) => (
              <li key={step} className="flex items-center gap-4">
                <span className="t-num grid size-11 flex-none place-items-center rounded-full border border-gold/50 text-gold">
                  {i + 1}
                </span>
                <span className="text-[1.08rem]">{step}</span>
              </li>
            ))}
          </ol>
          <p className="measure mt-10 text-muted">{apply.promise}</p>
        </div>
        <ApplyFlow />
      </div>
    </section>
  );
}
