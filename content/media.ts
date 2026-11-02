import founderAvatar from "@/content/assets/founder-avatar.jpg";
import founderPortrait from "@/content/assets/founder-portrait.jpg";

/**
 * Every video and image slot on the site.
 *
 * Videos are hosted on Vercel Blob (store "ecomplusacademy-media", fra1),
 * not in the repo. To replace one: upload new files under a NEW folder
 * (vsl/v2/…, the old URLs are cached for a year) and change the URLs here:
 *   vercel blob put file.mp4 --access public --pathname vsl/v2/tanitim-720.mp4 --cache-control-max-age 31536000
 * Encode for the web first: H.264 + AAC, 30 fps, 720p ≈ 1.8 Mbit/s and
 * 1080p ≈ 3.5 Mbit/s, with the moov atom at the front ("faststart").
 *
 * The VSL can also be a YouTube video ({ kind: "youtube", id }).
 * `npm run prelaunch` fails while any entry is `sample: true`.
 *
 * Founder photos: cropped from brand/source/founder-terrace.jpg (900×1600,
 * WhatsApp-compressed). Replace with a sharper original when it arrives.
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

const BLOB = "https://ehy57azkjahgvdm9.public.blob.vercel-storage.com";

/** Typed as the whole union, so a slot can switch to YouTube without touching its users. */
const file = (video: Omit<Extract<VideoSource, { kind: "file" }>, "kind">): VideoSource => ({ kind: "file", ...video });

/** Onur's intro video (2:26). Sample: the client may still send the final cut. */
const intro = file({
  mobile: `${BLOB}/vsl/v1/tanitim-720.mp4`,
  desktop: `${BLOB}/vsl/v1/tanitim-1080.mp4`,
  poster: `${BLOB}/vsl/v1/tanitim-poster.webp`,
  sample: true,
});

export const MEDIA = {
  /** Main video under the hero. */
  vsl: intro,
  /** "Before your call" video on the thank-you page (the intro until a dedicated one exists). */
  preCall: intro,
  founder: {
    /** 4:5, story section. */
    portrait: { src: founderPortrait, alt: "Onur Yeşil, Ecom Plus Academy kurucusu" },
    /** Square face crop: hero byline, coach card, thank-you page. */
    avatar: { src: founderAvatar, alt: "Onur Yeşil" },
  },
} as const;
