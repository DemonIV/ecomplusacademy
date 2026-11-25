import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ResourceLibrary } from "@/components/resources/resource-library";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { BRAND } from "@/content/brand";
import { COPY } from "@/content/copy";
import { MEDIA } from "@/content/media";
import { RESOURCES } from "@/content/resources";
import { sortedResources, toCard } from "@/lib/resources";

const T = COPY.resources;

export const metadata: Metadata = {
  title: T.metaTitle,
  description: T.metaDescription,
  alternates: { canonical: "/kaynaklar" },
  openGraph: { title: T.metaTitle, description: T.metaDescription },
};

/** "@handle" from the Instagram address in content/brand.ts. */
function instagramHandle(url: string): string {
  try {
    const handle = new URL(url).pathname.split("/").filter(Boolean)[0];
    return handle ? `@${handle}` : "Instagram";
  } catch {
    return "Instagram";
  }
}

/**
 * The page the Instagram videos point to instead of the DMs, laid out like a
 * profile: who is talking, then a grid of resources. Not linked from the
 * landing page, so the funnel stays exactly as it is; the link lives in the
 * Instagram bio and stories.
 */
export default function ResourcesPage() {
  const resources = sortedResources(RESOURCES).map(toCard);
  return (
    <>
      <Header />
      <main className="relative overflow-hidden pt-[calc(var(--header-h)+2.5rem)]">
        <div className="ambient" />
        <div className="shell relative max-w-[56rem] pb-[var(--section-space)]">
          <h1 className="sr-only">{T.metaTitle}</h1>

          <div className="flex items-center gap-5 sm:gap-8">
            <span className="flex-none rounded-full bg-[conic-gradient(from_210deg,var(--gold),var(--kraft),var(--silver),var(--gold))] p-[3px]">
              <Image
                src={MEDIA.founder.avatar.src}
                alt={MEDIA.founder.avatar.alt}
                width={96}
                height={96}
                priority
                className="size-20 rounded-full border-[3px] border-night object-cover sm:size-24"
              />
            </span>
            <div className="min-w-0">
              <p className="font-display text-xl font-semibold tracking-[-0.02em] sm:text-2xl">{BRAND.founder.name}</p>
              <p className="text-sm text-muted">
                {instagramHandle(BRAND.social.instagram)} · {BRAND.founder.title}
              </p>
              <ul className="mt-3 flex gap-5 sm:gap-8">
                {T.stats(resources.length).map((stat) => (
                  <li key={stat.label} className="leading-tight">
                    <span className="t-num block font-semibold text-paper">{stat.value}</span>
                    <span className="text-xs text-muted">{stat.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 space-y-0.5">
            {T.bio.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            <Link href="/#basvuru" className="btn btn-gold btn-sm flex-1 sm:flex-none">
              {T.applyCta}
            </Link>
            <a
              href={BRAND.social.instagram}
              target="_blank"
              rel="noopener"
              className="btn btn-ghost btn-sm flex-1 sm:flex-none"
            >
              {T.instagramCta}
            </a>
          </div>

          <ResourceLibrary resources={resources} />
        </div>
      </main>
      <Footer />
    </>
  );
}
