import type { Metadata } from "next";
import { Footer } from "@/components/sections/footer";
import { Header } from "@/components/sections/header";
import { BookingSummary } from "@/components/thanks/booking-summary";
import { BRAND } from "@/content/brand";
import { COPY } from "@/content/copy";
import { MEDIA, type VideoSource } from "@/content/media";
import { whatsappLink } from "@/lib/phone";

export const metadata: Metadata = {
  title: "Görüşmen planlandı",
  robots: { index: false, follow: false },
};

export default function ThanksPage() {
  const { thanks } = COPY;
  // Widened on purpose: the slot may hold a YouTube video once the real one exists.
  const video = MEDIA.preCall as VideoSource;
  return (
    <>
      <Header cta={false} />
      <main className="relative overflow-hidden pt-[calc(var(--header-h)+3rem)]">
        <div className="ambient" />
        <div className="shell relative pb-[var(--section-space)]">
          <BookingSummary />

          <div className="mt-[calc(var(--section-space)*0.6)] grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div>
              <h2 className="t-h3">{thanks.videoTitle}</h2>
              <div className="relative mt-5 overflow-hidden rounded-[var(--radius-card)] border border-line-strong bg-deep">
                {video.kind === "file" ? (
                  <video
                    className="aspect-video w-full object-cover"
                    controls
                    playsInline
                    preload="none"
                    poster={video.poster}
                  >
                    <source src={video.desktop} type="video/mp4" />
                  </video>
                ) : (
                  <iframe
                    className="aspect-video w-full"
                    src={`https://www.youtube-nocookie.com/embed/${video.id}`}
                    title={thanks.videoTitle}
                    allow="accelerometer; encrypted-media; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                )}
                {video.sample && <span className="sample-badge absolute left-3 top-3">Örnek video</span>}
              </div>
            </div>
            <div>
              <h2 className="t-h3">{thanks.prepTitle}</h2>
              <ol className="mt-5 space-y-4">
                {thanks.prep.map((item, i) => (
                  <li key={item} className="flex gap-4">
                    <span className="t-num grid size-8 flex-none place-items-center rounded-full border border-gold/50 text-sm text-gold">
                      {i + 1}
                    </span>
                    <span className="pt-1 text-muted">{item}</span>
                  </li>
                ))}
              </ol>
              <a
                className="btn btn-ghost mt-8"
                target="_blank"
                rel="noopener"
                href={whatsappLink(BRAND.contact.whatsapp, thanks.whatsappText)}
              >
                {thanks.whatsapp}
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
