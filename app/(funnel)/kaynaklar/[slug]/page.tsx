import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ResourceBlocks } from "@/components/resources/resource-blocks";
import { ResourceCover, ResourceTile } from "@/components/resources/resource-cover";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { TrackedLink } from "@/components/tracking/tracked-link";
import { TrackOnce } from "@/components/tracking/track-once";
import { LineIcon } from "@/components/ui/line-icon";
import { SITE } from "@/config/site";
import { COPY } from "@/content/copy";
import { RESOURCES } from "@/content/resources";
import { META_EVENTS } from "@/lib/meta/events";
import { findResource, relatedResources, toCard } from "@/lib/resources";

const T = COPY.resources;

/** Every resource is prerendered; any other address renders on request and ends in notFound(). */
export function generateStaticParams() {
  return RESOURCES.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({ params }: PageProps<"/kaynaklar/[slug]">): Promise<Metadata> {
  const resource = findResource((await params).slug, RESOURCES);
  if (!resource) return { title: T.metaTitle };
  return {
    title: resource.title,
    description: resource.summary,
    alternates: { canonical: `/kaynaklar/${resource.slug}` },
    openGraph: { title: resource.title, description: resource.summary, type: "article" },
  };
}

const dateFormat = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function ResourcePage({ params }: PageProps<"/kaynaklar/[slug]">) {
  return (
    <>
      <Header />
      <main className="relative overflow-hidden pt-[calc(var(--header-h)+2rem)]">
        <div className="ambient" />
        <div className="shell relative max-w-[56rem] pb-[var(--section-space)]">
          <Link href="/kaynaklar" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-paper">
            <LineIcon id="back" className="size-4" />
            {T.back}
          </Link>
          {/* Params are read inside the boundary, as Partial Prefetching expects (see the ISR guide in node_modules/next/dist/docs). */}
          <Suspense fallback={<div className="mt-6 aspect-[16/10] rounded-[12px] bg-panel/60" />}>
            <ResourceContent params={params} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}

async function ResourceContent({ params }: Pick<PageProps<"/kaynaklar/[slug]">, "params">) {
  const resource = findResource((await params).slug, RESOURCES);
  if (!resource) notFound();
  const related = relatedResources(resource, RESOURCES).map(toCard);
  const tracked = { content_name: resource.title, content_category: "kaynak", keyword: resource.keyword };

  return (
    <>
      <TrackOnce event={META_EVENTS.viewContent} params={tracked} />

      <article className="mt-6">
        <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center md:gap-10">
          <ResourceCover
            keyword={resource.keyword}
            kind={resource.kind}
            tone={resource.tone}
            className="aspect-[16/10] md:aspect-square"
          />
          <header>
            <p className="text-sm text-muted">
              {resource.kind} · <time dateTime={resource.date}>{dateFormat.format(new Date(resource.date))}</time>
            </p>
            <h1 className="t-h2 mt-3">{resource.title}</h1>
            <p className="t-lead mt-4">{resource.summary}</p>
            {resource.instagram && (
              <a
                href={resource.instagram}
                target="_blank"
                rel="noopener"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:text-paper"
              >
                {T.watchReel}
                <LineIcon id="external" className="size-4" />
              </a>
            )}
          </header>
        </div>

        <div className="mt-10">
          <ResourceBlocks blocks={resource.blocks} />
        </div>
      </article>

      <aside className="panel relative mt-14 overflow-hidden p-6 sm:p-10">
        <div className="ambient" />
        <div className="relative">
          <p className="inline-flex rounded-full border border-gold/40 px-3 py-1 text-xs font-bold text-gold">{SITE.cohortLabel}</p>
          <h2 className="t-h3 mt-4 max-w-[30ch]">{T.cta.title}</h2>
          <p className="measure mt-3 text-muted">{T.cta.text}</p>
          <TrackedLink
            href="/#basvuru"
            event={META_EVENTS.resourceCta}
            params={tracked}
            className="btn btn-gold mt-6 w-full sm:w-auto"
          >
            {T.cta.button}
          </TrackedLink>
        </div>
      </aside>

      {related.length > 0 && (
        <section className="mt-14" aria-labelledby="related-title">
          <h2 id="related-title" className="t-h3">
            {T.more}
          </h2>
          <ul className="mt-5 grid grid-cols-3 gap-x-2 gap-y-5 sm:gap-x-4 md:gap-x-5">
            {related.map((card) => (
              <li key={card.slug}>
                <ResourceTile resource={card} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
