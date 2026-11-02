/**
 * Every video and image slot on the site. TEMPORARY CONTENT: free Mixkit
 * stock clips (Mixkit License, hotlinked from their CDN) stand in until
 * the client supplies the real VSL and consented student videos.
 * `npm run prelaunch` fails while any entry is `sample: true`.
 *
 * VSL can be a YouTube video ({ kind: "youtube", id }) or a file ({ kind: "file" }).
 */

export type VideoSource =
  | { kind: "youtube"; id: string; poster?: string; sample?: boolean }
  | {
      kind: "file";
      /** Smaller file for phones (≤ 767 px), full quality for larger screens. */
      mobile: string;
      desktop: string;
      poster: string;
      sample?: boolean;
    };

const mixkit = (id: number): Extract<VideoSource, { kind: "file" }> => ({
  kind: "file",
  mobile: `https://assets.mixkit.co/videos/${id}/${id}-360.mp4`,
  desktop: `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`,
  poster: `https://assets.mixkit.co/videos/${id}/${id}-thumb-720-0.jpg`,
  sample: true,
});

export const MEDIA = {
  /** Main sales video under the hero. */
  vsl: mixkit(31218),
  /** Short "before your call" video on the thank-you page. */
  preCall: mixkit(20770),
  /** Student stories — one per entry in COPY.testimonials.items. */
  testimonials: [mixkit(42137), mixkit(42135), mixkit(42125), mixkit(42131), mixkit(42122), mixkit(31274)],
  founderPortrait: { src: null as string | null, alt: "Kurucu fotoğrafı", sample: true },
} as const;

export const MEDIA_ORIGINS = ["https://assets.mixkit.co"];
