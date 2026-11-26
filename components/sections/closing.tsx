import Image from "next/image";
import { COPY } from "@/content/copy";
import { MEDIA } from "@/content/media";

export function Closing() {
  const { closing } = COPY;
  return (
    <section className="section pt-0" aria-labelledby="closing-title">
      <div className="shell">
        <div className="panel relative overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16">
          <Image
            src={MEDIA.closing.src}
            alt=""
            placeholder="blur"
            sizes="(min-width: 1280px) 1160px, 100vw"
            className="pointer-events-none absolute inset-0 size-full object-cover object-right"
          />
          {/* Keeps the copy readable over the picture, a little lighter where there is room beside it. */}
          <div className="pointer-events-none absolute inset-0 bg-night/75 sm:bg-night/60" />
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
