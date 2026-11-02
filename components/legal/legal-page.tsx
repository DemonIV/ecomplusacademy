import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import type { LegalDoc } from "@/content/legal";

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <Header cta={false} />
      <main className="pt-[calc(var(--header-h)+3rem)]">
        <article className="shell max-w-[52rem] pb-[var(--section-space)]">
          <h1 className="t-h2">{doc.title}</h1>
          <p className="mt-4 text-sm text-faint">{doc.updated}</p>
          <p className="t-lead mt-8">{doc.intro}</p>
          {doc.sections.map((section) => (
            <section key={section.heading} className="mt-12">
              <h2 className="t-h3">{section.heading}</h2>
              <div className="mt-4 space-y-3 text-muted">
                {section.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </main>
      <Footer />
    </>
  );
}
