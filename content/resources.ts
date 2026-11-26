/**
 * Free resources from the Instagram videos ("yoruma ÜRÜN yaz" and the like).
 * Instead of sending each one by DM, the video points to /kaynaklar: the
 * visitor types the word from the video and gets the resource at once.
 * Every resource page ends with the application CTA, so the people who are
 * ready (and can afford it) move on to the qualification questions.
 *
 * To add one: copy an entry, give it a short ASCII `slug` (the address,
 * /kaynaklar/<slug>) and the `keyword` said in the video. The newest `date`
 * comes first in the grid. Files (PDF, sheets) live on Vercel Blob like the
 * videos in content/media.ts, under a new folder for every version:
 *   vercel blob put plan.pdf --access public --pathname kaynaklar/v1/plan.pdf
 *
 * Content rules from content/copy.ts apply: no income promises.
 * `sample: true` marks a placeholder; `npm run prelaunch` fails while any remain.
 */

export type ResourceKind = "Kontrol listesi" | "Rehber" | "Liste" | "PDF" | "Araç";

/** Cover colour: gold (the plus in the logo), silver (the E) or kraft (parcels). */
export type ResourceTone = "gold" | "silver" | "kraft";

export type ResourceBlock =
  | { type: "text"; text: string }
  /** Numbered steps or a checklist. */
  | { type: "steps"; title?: string; items: readonly string[] }
  /** Cards, e.g. products or tools, each with an optional link. */
  | { type: "items"; title?: string; items: readonly { title: string; text?: string; href?: string }[] }
  /** A downloadable file (PDF, sheet). */
  | { type: "file"; label: string; href: string; note?: string }
  /** An outside page or tool. */
  | { type: "link"; label: string; href: string; note?: string };

export type Resource = {
  /** Address: /kaynaklar/<slug>. Lower-case ASCII, digits and hyphens. */
  slug: string;
  /** The word said in the video. The search box also finds it typed in lower case or without Turkish letters. */
  keyword: string;
  /** Other words that should find the same resource. */
  aliases?: readonly string[];
  title: string;
  /** One or two sentences under the title, also the page description for search engines and link previews. */
  summary: string;
  kind: ResourceKind;
  /** YYYY-MM-DD, newest first in the grid. */
  date: string;
  tone: ResourceTone;
  /** The Reel that announces it: a "watch the video" link on the page. */
  instagram?: string;
  blocks: readonly ResourceBlock[];
  sample?: boolean;
};

export const RESOURCES: readonly Resource[] = [
  {
    /** Example: replace with the real resources from the videos. */
    sample: true,
    slug: "urun",
    keyword: "ÜRÜN",
    aliases: ["urunler", "urun secimi"],
    title: "Ürün seçerken bakılacak 7 şey",
    summary: "Bir ürünü teste almadan önce bu yedi soruyla ele. Zayıf olanı reklama para harcamadan elersin.",
    kind: "Kontrol listesi",
    date: "2026-11-24",
    tone: "gold",
    blocks: [
      {
        type: "steps",
        items: [
          "Bir sorunu çözüyor ya da güçlü bir istek uyandırıyor mu? Sadece “güzel” olması yetmez.",
          "Videoda üç saniyede anlaşılıyor mu? Kendini anlatan ürünün reklamı daha kolay olur.",
          "Satış fiyatı ürün, kargo ve reklam maliyetinin toplamını rahatça karşılıyor mu?",
          "Kırılma, beden ya da iade riski düşük mü?",
          "Her mağazada bulunuyor mu? Bulunuyorsa fiyatla yarışırsın.",
          "Tedarikçi aynı kaliteyi tekrar tekrar gönderebiliyor mu? Önce numune iste.",
          "Rakipler reklam veriyor mu? Kimse vermiyorsa talep olmayabilir; herkes veriyorsa farklı bir açı bul.",
        ],
      },
      {
        type: "text",
        text: "Yedi sorunun en az beşine “evet” diyorsan ürün teste aday. Değilse vakit kaybetmeden sıradakine geç.",
      },
    ],
  },
  {
    sample: true,
    slug: "reklam",
    keyword: "REKLAM",
    aliases: ["reklamlar", "test"],
    title: "İlk reklam testinden önce kontrol listesi",
    summary: "Reklamı açmadan önce bu beş maddeyi tamamla. Sonuç kötü gelirse sorunun reklamda mı üründe mi olduğunu ayırabilirsin.",
    kind: "Kontrol listesi",
    date: "2026-11-20",
    tone: "silver",
    blocks: [
      {
        type: "steps",
        items: [
          "Meta Pikseli ve Dönüşümler API'si kurulu, test olayı Events Manager'da görünüyor.",
          "Ürün sayfası telefonda hızlı açılıyor; fiyat, kargo süresi ve iade koşulu ilk bakışta okunuyor.",
          "Her ürün için en az üç farklı video açısı hazır: sorun, kullanım, sonuç.",
          "Günlük bütçe ve durdurma kuralın baştan belli: ne kadar harcayıp satış gelmezse kapatacağını yaz.",
          "Testin sonunda neye bakacağını biliyorsun: tıklama oranı, sepete ekleme ve satış başına maliyet.",
        ],
      },
    ],
  },
  {
    sample: true,
    slug: "tedarik",
    keyword: "TEDARİK",
    aliases: ["tedarikci", "toptanci"],
    title: "Tedarikçiye sorman gereken 6 soru",
    summary: "İlk siparişten önce bu soruları sor. Cevaplar, sorun çıktığında yalnız kalıp kalmayacağını gösterir.",
    kind: "Rehber",
    date: "2026-11-16",
    tone: "kraft",
    blocks: [
      {
        type: "items",
        items: [
          { title: "Numune gönderiyor musunuz?", text: "Kaliteyi kendi elinle görmeden müşteriye söz verme." },
          { title: "Hazırlık ve kargo kaç gün sürüyor?", text: "Yoğun dönemde bu sürenin nasıl değiştiğini de sor." },
          { title: "Hasarlı üründe ne yapıyorsunuz?", text: "Değişim mi, iade mi, kim karşılıyor: yazılı olsun." },
          { title: "Markasız gönderebiliyor musunuz?", text: "Pakette başka bir firmanın adı olmasın." },
          { title: "Adet arttıkça fiyat nasıl değişiyor?", text: "Ölçeklendiğinde kârının nereye gideceğini baştan gör." },
          { title: "Stok azalınca haber veriyor musunuz?", text: "Reklam dönerken ürünün bitmesi en pahalı hatadır." },
        ],
      },
    ],
  },
];
