import type { MetadataRoute } from "next";
import { RESOURCES } from "@/content/resources";
import { siteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/kaynaklar`, changeFrequency: "weekly", priority: 0.6 },
    ...RESOURCES.map((resource) => ({
      url: `${base}/kaynaklar/${resource.slug}`,
      lastModified: resource.date,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    { url: `${base}/kvkk`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/gizlilik`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/cerez`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
