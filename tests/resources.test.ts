import { describe, expect, it } from "vitest";
import { RESOURCES, type Resource } from "@/content/resources";
import {
  canonicalResourcesPath,
  findResource,
  normalizeKeyword,
  relatedResources,
  searchResources,
  sortedResources,
} from "@/lib/resources";

const make = (slug: string, keyword: string, date: string, extra: Partial<Resource> = {}): Resource => ({
  slug,
  keyword,
  title: `${keyword} başlığı`,
  summary: "Özet",
  kind: "Rehber",
  date,
  tone: "gold",
  blocks: [{ type: "text", text: "Metin" }],
  ...extra,
});

const LIST = [
  make("urun", "ÜRÜN", "2026-11-24", { aliases: ["ürünler"] }),
  make("tedarik", "TEDARİK", "2026-11-16", { title: "Tedarikçiye sorman gereken 6 soru" }),
  make("reklam", "REKLAM", "2026-11-20"),
];

describe("normalizeKeyword", () => {
  it("folds Turkish letters, case and punctuation into one form", () => {
    for (const typed of ["ürün", "ÜRÜN", "Ürün", "urun", " #ürün! "]) expect(normalizeKeyword(typed)).toBe("urun");
    expect(normalizeKeyword("TEDARİK")).toBe("tedarik");
    expect(normalizeKeyword("IŞIK")).toBe("isik");
    expect(normalizeKeyword("ışık")).toBe("isik");
    expect(normalizeKeyword("🔥")).toBe("");
  });
});

describe("findResource", () => {
  it("finds by slug, by keyword and by an encoded keyword in the URL", () => {
    expect(findResource("urun", LIST)?.slug).toBe("urun");
    expect(findResource("ÜRÜN", LIST)?.slug).toBe("urun");
    expect(findResource(encodeURIComponent("ürünler"), LIST)?.slug).toBe("urun");
    expect(findResource("Tedarik", LIST)?.slug).toBe("tedarik");
  });

  it("returns null for anything else, malformed escapes included", () => {
    expect(findResource("yok", LIST)).toBeNull();
    expect(findResource("%E0%A4%A", LIST)).toBeNull();
    expect(findResource("", LIST)).toBeNull();
  });
});

describe("searchResources", () => {
  it("opens the resource whose word was typed", () => {
    expect(searchResources("ürün", LIST).exact?.slug).toBe("urun");
    expect(searchResources("ÜRÜNLER", LIST).exact?.slug).toBe("urun");
  });

  it("narrows the grid while typing and opens a single partial match", () => {
    const partial = searchResources("ür", LIST);
    expect(partial.matches.map((r) => r.slug)).toEqual(["urun"]);
    expect(partial.exact?.slug).toBe("urun");
  });

  it("searches titles too", () => {
    expect(searchResources("sorman", LIST).matches.map((r) => r.slug)).toEqual(["tedarik"]);
  });

  it("keeps everything, newest first, for an empty query", () => {
    expect(searchResources("  ", LIST).matches.map((r) => r.slug)).toEqual(["urun", "reklam", "tedarik"]);
    expect(searchResources("", LIST).exact).toBeNull();
  });

  it("finds nothing for an unknown word", () => {
    expect(searchResources("kargo", LIST)).toEqual({ exact: null, matches: [] });
  });
});

describe("canonicalResourcesPath", () => {
  it("sends every spelling of the address to /kaynaklar, keeping the rest of the path", () => {
    expect(canonicalResourcesPath("/Kaynaklar")).toBe("/kaynaklar");
    expect(canonicalResourcesPath("/KAYNAKLAR")).toBe("/kaynaklar");
    expect(canonicalResourcesPath("/kaynak")).toBe("/kaynaklar");
    expect(canonicalResourcesPath("/Kaynak")).toBe("/kaynaklar");
    expect(canonicalResourcesPath("/Kaynaklar/urun")).toBe("/kaynaklar/urun");
    expect(canonicalResourcesPath("/KAYNAK/ÜRÜN")).toBe("/kaynaklar/ÜRÜN");
  });

  it("never redirects the right address (that would loop) or other pages", () => {
    expect(canonicalResourcesPath("/kaynaklar")).toBeNull();
    expect(canonicalResourcesPath("/kaynaklar/urun")).toBeNull();
    expect(canonicalResourcesPath("/")).toBeNull();
    expect(canonicalResourcesPath("/kaynaklarim")).toBeNull();
    expect(canonicalResourcesPath("/kvkk")).toBeNull();
  });
});

describe("relatedResources", () => {
  it("lists the others, newest first", () => {
    expect(relatedResources(LIST[1], LIST).map((r) => r.slug)).toEqual(["urun", "reklam"]);
  });
});

describe("content/resources.ts", () => {
  it("has at least one resource (the dynamic route needs a param to prerender)", () => {
    expect(RESOURCES.length).toBeGreaterThan(0);
  });

  it("uses short, unique ASCII slugs", () => {
    const slugs = RESOURCES.map((r) => r.slug);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("never lets two resources answer to the same word", () => {
    const owner = new Map<string, string>();
    for (const resource of RESOURCES) {
      for (const word of new Set([resource.slug, resource.keyword, ...(resource.aliases ?? [])].map(normalizeKeyword))) {
        expect(word, `${resource.slug}: empty word`).not.toBe("");
        expect(owner.get(word) ?? resource.slug, `"${word}" is used by two resources`).toBe(resource.slug);
        owner.set(word, resource.slug);
      }
    }
  });

  it("has real dates, a body and https links", () => {
    for (const resource of RESOURCES) {
      expect(resource.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(resource.date))).toBe(false);
      expect(resource.blocks.length).toBeGreaterThan(0);
      const links = resource.blocks.flatMap((block) =>
        block.type === "file" || block.type === "link"
          ? [block.href]
          : block.type === "items"
            ? block.items.flatMap((item) => (item.href ? [item.href] : []))
            : [],
      );
      for (const href of [...links, ...(resource.instagram ? [resource.instagram] : [])]) {
        expect(href).toMatch(/^https:\/\//);
      }
    }
    expect(sortedResources(RESOURCES)[0].date >= sortedResources(RESOURCES).at(-1)!.date).toBe(true);
  });
});
