import type { Metadata } from "next";
import Image from "next/image";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { BRAND } from "@/content/brand";
import { COPY } from "@/content/copy";
import { MEDIA } from "@/content/media";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Başvurun için teşekkürler",
  robots: { index: false, follow: false },
};

type Resource = { title: string; text: string; href: string; cta: string; download?: boolean };

/**
 * Applicants who are not a fit right now: free material and a way into the
 * Instagram DMs, never a "rejected" page. The "İlk 30 Gün Planı" card shows
 * up once its file is set in config/site.ts.
 */
export default function ResultPage() {
  const { result } = COPY;
  const { instagram, thirtyDayPlan } = SITE.result;
  const resources: Resource[] = [
    ...(thirtyDayPlan.href ? [{ ...thirtyDayPlan, href: thirtyDayPlan.href, download: true }] : []),
    instagram,
  ];
  return (
    <>
      <Header cta={false} />
      <main className="relative overflow-hidden pt-[calc(var(--header-h)+3rem)]">
        <div className="ambient" />
        <div className="shell relative pb-[var(--section-space)]">
          <h1 className="t-display max-w-[20ch]">{result.title}</h1>
          <p className="t-lead measure mt-6">{result.lead}</p>

          <figure className="mt-10 flex max-w-xl items-center gap-4 rounded-[var(--radius-card)] border border-line-strong bg-panel/60 p-5">
            <Image
              src={MEDIA.founder.avatar.src}
              alt=""
              width={56}
              height={56}
              className="size-14 flex-none rounded-2xl border border-line-strong object-cover"
            />
            <div>
              <blockquote className="font-display text-[1.15rem] font-medium leading-snug">“{result.quote}”</blockquote>
              <figcaption className="mt-1.5 text-sm text-muted">
                {BRAND.founder.name} · {BRAND.founder.title}
              </figcaption>
            </div>
          </figure>

          <h2 className="t-h3 mt-14">{result.resourcesTitle}</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:max-w-4xl">
            {resources.map((resource) => (
              <li key={resource.title}>
                <a
                  href={resource.href}
                  {...(resource.download ? { download: "" } : { target: "_blank", rel: "noopener" })}
                  className="group flex h-full flex-col rounded-[var(--radius-card)] border border-line-strong bg-panel/60 p-6 transition-colors hover:border-gold/60"
                >
                  <span className="t-h3">{resource.title}</span>
                  <span className="mt-2 text-muted">{resource.text}</span>
                  <span className="btn btn-gold btn-sm mt-6 self-start">{resource.cta}</span>
                </a>
              </li>
            ))}
          </ul>

          <p className="measure mt-14 text-muted">{result.reapply(SITE.reapplyDays)}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
