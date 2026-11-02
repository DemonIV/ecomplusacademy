import { COPY } from "@/content/copy";

export function Faq() {
  const { faq } = COPY;
  return (
    <section className="section" aria-labelledby="faq-title">
      <div className="shell grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
        <h2 id="faq-title" className="t-h2">
          {faq.title}
        </h2>
        <div className="divide-y divide-line border-y border-line">
          {faq.items.map((item) => (
            <details key={item.q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.08rem] font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  className="grid size-8 flex-none place-items-center rounded-full border border-line-strong text-gold transition-transform duration-300 group-open:rotate-45"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="measure pb-6 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
