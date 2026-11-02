import { COPY } from "@/content/copy";

export function Closing() {
  const { closing } = COPY;
  return (
    <section className="section pt-0" aria-labelledby="closing-title">
      <div className="shell">
        <div className="panel relative overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16">
          <div className="ambient" />
          <h2 id="closing-title" className="t-h2 relative mx-auto max-w-[20ch]">
            {closing.title}
          </h2>
          <p className="t-lead relative mx-auto mt-5 max-w-[46ch]">{closing.text}</p>
          <a href="#basvuru" className="btn btn-gold relative mt-8 w-full sm:w-auto">
            {closing.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
