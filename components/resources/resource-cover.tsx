import Link from "next/link";
import type { ResourceTone } from "@/content/resources";
import type { ResourceCard } from "@/lib/resources";

const TONE: Record<ResourceTone, string> = {
  gold: "cover-gold",
  silver: "cover-silver",
  kraft: "cover-kraft",
};

/**
 * A text post like the covers in an Instagram grid: the word from the video,
 * as large as the cover allows. The font size follows the word's length so
 * "ÜRÜN" and "TEDARİKÇİ" both fill the width without breaking.
 */
export function ResourceCover({
  keyword,
  kind,
  tone,
  className = "",
}: {
  keyword: string;
  kind: string;
  tone: ResourceTone;
  className?: string;
}) {
  const size = Math.min(26, 92 / Math.max(keyword.length, 1));
  return (
    <span className={`cover ${TONE[tone]} ${className}`}>
      <span className="cover-kind">{kind}</span>
      <span className="cover-word" style={{ fontSize: `min(${size.toFixed(1)}cqi, 7rem)` }}>
        {keyword}
      </span>
    </span>
  );
}

/** A grid tile: the cover, then the title in two lines at most. */
export function ResourceTile({ resource }: { resource: ResourceCard }) {
  return (
    <Link href={`/kaynaklar/${resource.slug}`} className="group block rounded-[12px]">
      <ResourceCover
        keyword={resource.keyword}
        kind={resource.kind}
        tone={resource.tone}
        className="aspect-square group-hover:border-gold/60"
      />
      <span className="mt-2 line-clamp-2 text-[0.8125rem] leading-snug text-muted group-hover:text-paper sm:text-sm">
        {resource.title}
      </span>
    </Link>
  );
}
