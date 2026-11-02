import { CountUp, RevenueChart, RingGallery } from "@/components/sections/results-parts";
import { COPY } from "@/content/copy";

export function Results() {
  const { results } = COPY;
  const statsAreSamples = results.stats.some((s) => s.sample);
  return (
    <section className="section overflow-hidden bg-deep" aria-labelledby="results-title">
      <div className="shell">
        <div className="max-w-[44rem]">
          <h2 id="results-title" className="t-h2">
            {results.title}
          </h2>
          <p className="t-lead measure mt-5">{results.lead}</p>
        </div>
      </div>

      <div className="mt-14">
        <RingGallery items={results.gallery} />
      </div>

      <div className="shell mt-[calc(var(--section-space)*0.7)] grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
        <dl className="grid gap-8 sm:grid-cols-3 lg:grid-cols-1">
          {results.stats.map((stat) => (
            <div key={stat.label} className="flex flex-col border-l-2 border-gold/60 pl-5">
              <dt className="order-2 mt-1 text-muted">{stat.label}</dt>
              <dd className="order-1 text-[clamp(2.4rem,1.8rem+2.4vw,3.6rem)] leading-none">
                <CountUp value={stat.value} suffix={stat.suffix} decimals={"decimals" in stat ? stat.decimals : 0} />
              </dd>
            </div>
          ))}
          {statsAreSamples && <span className="sample-badge justify-self-start">Örnek rakamlar</span>}
        </dl>

        <figure className="panel relative overflow-hidden p-5 sm:p-7">
          <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="t-h3">{results.chart.title}</span>
            <span className="flex items-center gap-3 text-sm text-muted">
              {results.chart.note}
              {results.chart.sample && <span className="sample-badge">Örnek veri</span>}
            </span>
          </figcaption>
          <div className="mt-4">
            <RevenueChart months={results.chart.months} values={results.chart.values} />
          </div>
        </figure>
      </div>
    </section>
  );
}
