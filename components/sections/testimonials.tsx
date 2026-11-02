import { Coverflow, type Story } from "@/components/sections/coverflow";
import { COPY } from "@/content/copy";
import { MEDIA } from "@/content/media";

export function Testimonials() {
  const { testimonials } = COPY;
  const stories: Story[] = testimonials.items.map((item, i) => {
    const video = MEDIA.testimonials[i % MEDIA.testimonials.length];
    return {
      ...item,
      sample: item.sample || video.sample,
      poster: video.poster,
      preview: video.mobile,
      full: video.desktop,
    };
  });

  return (
    <section className="section overflow-hidden" aria-labelledby="stories-title">
      <div className="shell">
        <div className="max-w-[44rem]">
          <h2 id="stories-title" className="t-h2">
            {testimonials.title}
          </h2>
          <p className="t-lead measure mt-5">{testimonials.lead}</p>
        </div>
        <div className="mt-14">
          <Coverflow stories={stories} />
        </div>
      </div>
    </section>
  );
}
