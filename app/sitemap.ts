import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/kvkk`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/gizlilik`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/cerez`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
