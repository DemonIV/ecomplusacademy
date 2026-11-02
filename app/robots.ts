import type { MetadataRoute } from "next";
import { env, siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  // Crawling stays allowed so search engines can read the pages' noindex tag;
  // the sitemap is offered only once indexing is switched on (ALLOW_INDEXING=true).
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/tesekkurler", "/sonuc"] }],
    ...(env.allowIndexing() ? { sitemap: `${siteUrl()}/sitemap.xml` } : {}),
  };
}
