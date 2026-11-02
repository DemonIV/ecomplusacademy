import { LineIcon } from "@/components/ui/line-icon";
import { COPY } from "@/content/copy";

/** "Neden burada farklı?": the six promises on one screen, right under the video. */
export function Promises() {
  const { promises } = COPY;
  return (
    <section className="section pt-[calc(var(--section-space)*0.45)]" aria-labelledby="promises-title">
      <div className="shell">
        <div className="max-w-[40rem]">
          <h2 id="promises-title" className="t-h2">
            {promises.title}
          </h2>
          <p className="t-lead mt-4">{promises.lead}</p>
        </div>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-4">
          {promises.items.map((item) => (
            <li
              key={item.id}
              className="flex gap-4 rounded-[var(--radius-card)] border border-line bg-panel/50 p-5 sm:flex-col sm:gap-5 sm:p-6"
            >
              <span className="grid size-11 flex-none place-items-center rounded-xl bg-gold/12 text-gold">
                <LineIcon id={item.id} />
              </span>
              <div>
                <h3 className="font-display text-[1.06rem] font-medium leading-snug tracking-[-0.01em] sm:text-[1.14rem]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[0.98rem] text-muted">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex items-start gap-3 rounded-[var(--radius-card)] border border-gold/30 bg-gold/[0.06] px-5 py-4 font-semibold text-paper sm:items-center">
          <span className="grid size-7 flex-none place-items-center rounded-full bg-gold/15 text-gold">
            <LineIcon id="supply" className="size-4" />
          </span>
          {promises.footnote}
        </p>
      </div>
    </section>
  );
}
