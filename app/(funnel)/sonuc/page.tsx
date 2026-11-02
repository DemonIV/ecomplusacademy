import type { Metadata } from "next";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { COPY } from "@/content/copy";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Başvurun için teşekkürler",
  robots: { index: false, follow: false },
};

/** Applicants who are not a fit right now: free material, never a "rejected" page. */
export default function ResultPage() {
  const { result } = COPY;
  return (
    <>
      <Header cta={false} />
      <main className="relative overflow-hidden pt-[calc(var(--header-h)+3rem)]">
        <div className="ambient" />
        <div className="shell relative pb-[var(--section-space)]">
          <h1 className="t-display max-w-[20ch]">{result.title}</h1>
          <p className="t-lead measure mt-6">{result.lead}</p>

          <h2 className="t-h3 mt-16">{result.resourcesTitle}</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {SITE.freeResources.map((resource) => (
              <li key={resource.href}>
                <a
                  href={resource.href}
                  target="_blank"
                  rel="noopener"
                  className="group flex h-full flex-col rounded-[var(--radius-card)] border border-line-strong bg-panel/60 p-6 transition-colors hover:border-gold/60"
                >
                  <span className="t-h3">{resource.title}</span>
                  <span className="mt-2 text-muted">{resource.text}</span>
                  <span className="mt-6 text-sm font-semibold text-gold group-hover:underline">{resource.cta}</span>
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
