import { FounderTimeline } from "@/components/sections/founder-timeline";
import { BRAND } from "@/content/brand";
import { COPY } from "@/content/copy";
import { MEDIA } from "@/content/media";

function Portrait() {
  const portrait = MEDIA.founderPortrait;
  const initials = BRAND.founder.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <figure className="mt-10 flex items-center gap-5">
      <div className="relative size-24 flex-none overflow-hidden rounded-[22px] border border-line-strong bg-panel-2">
        {portrait.src ? (
          // eslint-disable-next-line @next/next/no-img-element -- client supplies the file; dimensions fixed by the frame
          <img src={portrait.src} alt={portrait.alt} className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center font-display text-2xl text-silver">{initials}</span>
        )}
      </div>
      <figcaption>
        <p className="font-display text-lg font-medium">{BRAND.founder.name}</p>
        <p className="text-muted">{BRAND.founder.title}</p>
        {(portrait.sample || COPY.founder.sample) && <span className="sample-badge mt-2">Örnek metin ve fotoğraf</span>}
      </figcaption>
    </figure>
  );
}

export function Founder() {
  const { founder } = COPY;
  return (
    <section className="section" aria-labelledby="founder-title">
      <div className="shell">
        <FounderTimeline
          milestones={[...founder.milestones]}
          intro={
            <div>
              <h2 id="founder-title" className="t-h2">
                {founder.title}
              </h2>
              <div className="measure mt-6 space-y-4 text-[1.08rem] text-muted">
                {founder.paragraphs.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
              <Portrait />
            </div>
          }
        />
      </div>
    </section>
  );
}
