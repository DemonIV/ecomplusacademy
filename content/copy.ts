/**
 * All landing-page copy (original Turkish). Anything marked `sample: true`
 * is still waiting for the client's real material — `npm run prelaunch`
 * lists them. Nothing on the page shows a "sample" badge.
 *
 * Meta ad policy and the brief: no income guarantees, no "ayda X kazandım",
 * "pasif gelir" or "3 ayda zengin". The proof is the founder's own story.
 * The month name comes from config/site.ts (`COHORT.month`).
 */

export const COPY = {
  nav: { cta: "Görüşme planla" },

  hero: {
    /** One sentence per line. */
    title: ["Battım.", "E-ticaretle ayağa kalktım.", "Aynı yolu seninle yürüyeyim."],
    lead: "Koç eşliğinde ilk ürününü buluyor, test ediyor, satmaya başlıyorsun. 30 dakikalık ücretsiz görüşmede sana uygun mu, birlikte bakalım.",
    cta: "30 dk ücretsiz görüşme planla",
    trust: ["Başarana kadar destek", "Birebir koç", "09:00–21:00 WhatsApp & Zoom"],
    /** Illustration on the globe: stocked in Türkiye, dropshipping abroad. */
    orderCards: [
      { city: "İzmir", product: "Seramik kahve seti", status: "Yeni sipariş" },
      { city: "Berlin", product: "Deri cüzdan", status: "Kargoya verildi" },
      { city: "Londra", product: "El yapımı mum", status: "Teslim edildi" },
    ],
  },

  vsl: {
    caption:
      "Önce bu 2,5 dakikalık videoyu izle: programın nasıl işlediğini ve ücretsiz görüşmede neye birlikte bakacağımızı anlatıyorum.",
    unmute: "Sesi aç",
    restart: "Baştan izle",
    play: "Videoyu oynat",
    ended: "Sana uygun olup olmadığını 30 dakikalık ücretsiz görüşmede birlikte netleştirelim.",
  },

  promises: {
    title: "Neden burada farklı?",
    lead: "Video teoridir, mağaza pratikle kurulur.",
    items: [
      {
        id: "support",
        title: "Başarana kadar destek",
        text: "Program 3 ay; destek süreyle bitmiyor. İlk ürünün tutana kadar yanındayız.",
      },
      {
        id: "mentor",
        title: "Birebir mentörlük",
        text: "İlk gün sana bir koç atanıyor. Listeyi birlikte tarıyor, testi birlikte kuruyor, sonucu birlikte okuyorsunuz.",
      },
      {
        id: "chat",
        title: "09:00–21:00 WhatsApp & Zoom",
        text: "Takıldığın an yaz; gerektiğinde Zoom'da ekranı açıp birlikte çözüyoruz.",
      },
      {
        id: "homework",
        title: "3 haftalık ödevli eğitim",
        text: "Video izleyip geçmek yok. Her hafta ödev, her ödev koç kontrolünden geçiyor.",
      },
      {
        id: "software",
        title: "Ürün bulma yazılımı",
        text: "Ürünü tahminle değil yazılımla buluyorsun; koç nasıl kullanılacağını gösteriyor.",
      },
      {
        id: "lifetime",
        title: "Ömür boyu erişim",
        text: "Discord topluluğu ve video eğitim paneli ömür boyu açık.",
      },
    ],
    footnote: "Türkiye'de stoklu, yurt dışında dropshipping: ikisi de eğitimin içinde.",
  },

  story: {
    /** Onur still has to fill in the years and the type of the business that closed. */
    sample: true,
    title: "500 bin lira borçla başladım.",
    paragraphs: [
      "Bundan 6 yıl önce bir iş kurdum ve battım. Geriye yaklaşık 500 bin lira borç kaldı. Maaşla ödesem yıllar sürecekti; ben de herkes gibi “ek gelir” aramaya başladım.",
      "O dönemde e-ticaretle tanıştım. Tek ürün, küçük bir reklam bütçesi, bol deneme yanılma. 3 ay içinde borcumun tamamını kapattım. Sonra düğünümü yaptım; kimseden borç almadan, e-ticaretten kazandığım parayla.",
      "Beş yılda kendi mağazalarımda 50 milyon liranın üzerinde satış yaptım. Bu sürede çevremdeki herkesin aynı yerde takıldığını gördüm: video izliyorlar, ama sabah kalkınca ne yapacaklarını bilmiyorlar. Ecom Plus Academy'yi bunun için kurdum: video teoridir, mağaza bir koçla yan yana kurulur.",
    ],
    /** Pull quote, shown after the second paragraph. */
    quote: "Lamborghini değil, düğün parası.",
    /** An empty `year` is not shown; fill it in when Onur confirms it. */
    milestones: [
      { year: "", title: "Battım", text: "Kurduğum iş kapandı; geriye 500 bin lira borç kaldı." },
      { year: "", title: "İlk ürün", text: "E-ticaretle tanıştım. Tek ürün, küçük bütçe, ilk siparişler." },
      { year: "", title: "Borç kapandı", text: "3 ay sonra. Son taksiti e-ticaret geliriyle ödedim." },
      { year: "", title: "Düğün", text: "Kendi düğünümü kendi kazancımla yaptım." },
      { year: "2025", title: "₺50M+ satış", text: "Kendi mağazalarımda geçilen eşik." },
      { year: "2026", title: "Ecom Plus Academy", text: "İlk dönem. Koçluğu bizzat ben yapıyorum." },
    ],
  },

  howItWorks: {
    title: "Nasıl işliyor?",
    steps: [
      { id: "product", label: "Ürün" },
      { id: "store", label: "Mağaza" },
      { id: "ads", label: "Reklam" },
      { id: "supply", label: "Tedarik" },
      { id: "shipping", label: "Kargo" },
      { id: "system", label: "Sistem" },
    ],
    weeks: [
      { when: "Hafta 1–3", what: "Eğitim + ödev" },
      { when: "Hafta 4", what: "İlk test" },
      { when: "Sonra", what: "Tutan ürün ölçeklenir, tutmayan değişir" },
    ],
  },

  coach: {
    title: (month: string) => `${month} döneminde koçun benim.`,
    text: "İlk dönem küçük tutuluyor; her öğrenciyle bizzat ilgileniyorum.",
    /** No-break space keeps "10 kişi" together when the line wraps. */
    capacity: (month: string, seats: number) => `${month} dönemi: ${seats} kişi`,
    capacityText: "Koçluğu bizzat ben yapıyorum, bu yüzden az kişi alıyorum.",
    left: (left: number, seats: number) => `${seats} kişilik dönemde ${left} yer kaldı`,
    cta: "30 dk ücretsiz görüşme planla",
  },

  apply: {
    title: "Ücretsiz strateji görüşmeni planla",
    steps: ["4 kısa soruyu yanıtla", "İletişim bilgilerini bırak", "Takvimden sana uyan saati seç"],
    promise: "Görüşme ücretsizdir ve satış baskısı yoktur. Sana uygun değilsek bunu açıkça söyleriz.",
    back: "Geri",
    contactTitle: "Sana nasıl ulaşalım?",
    contactLead: "Görüşme Zoom'dan yapılır; bağlantı, onay ve hatırlatmalar e-postana gelir. Gerekirse WhatsApp'tan yazarız.",
    fields: {
      fullName: { label: "Ad soyad", placeholder: "Adın ve soyadın" },
      phone: { label: "WhatsApp numaran", placeholder: "05xx xxx xx xx", hint: "Yurt dışındaysan ülke koduyla yaz, örn. +49…" },
      email: { label: "E-posta", placeholder: "ornek@eposta.com" },
      instagram: { label: "Instagram kullanıcı adın", placeholder: "@kullaniciadi", optional: "isteğe bağlı" },
    },
    kvkk: {
      before: "",
      link: "KVKK Aydınlatma Metni",
      after: "'ni okudum; başvurumun değerlendirilmesi ve görüşmenin planlanması için bilgilerimin işlenmesini kabul ediyorum.",
    },
    marketing:
      "Reklamlarınızın ölçülebilmesi için iletişim bilgilerimin şifrelenerek (hash) Meta ile paylaşılmasına açık rıza veriyorum. İsteğe bağlı.",
    submit: "Uygun saatleri göster",
    submitting: "Kontrol ediliyor…",
    errors: {
      fullName: "Adını ve soyadını yaz.",
      phone: "Geçerli bir cep telefonu yaz (05xx xxx xx xx).",
      email: "Geçerli bir e-posta adresi yaz.",
      kvkk: "Devam etmek için aydınlatma metnini onaylaman gerekiyor.",
      generic: "Başvurun gönderilemedi. Bağlantını kontrol edip tekrar dene.",
    },
    notices: {
      already_booked: {
        title: "Zaten planlanmış bir görüşmen var",
        text: "Calendly'den gelen onay e-postasındaki bağlantıdan saatini görebilir veya değiştirebilirsin.",
      },
      known_customer: {
        title: "Seni zaten tanıyoruz",
        text: "Programdaysan destek ekibimize WhatsApp'tan yazman yeterli, hemen yardımcı olalım.",
      },
      received: {
        title: "Başvurun alındı",
        text: "Ekibimiz başvurunu inceleyip seninle iletişime geçecek.",
      },
    },
    calendarTitle: (firstName: string) => `Harika ${firstName}, sana uyan saati seç`,
    calendarLead: "Görüşme 30 dakika, Zoom'dan. Saati seçince bağlantı e-postana gelir.",
    noSlotWhatsappText: (firstName: string) =>
      `Merhaba, ben ${firstName}. Başvurumu yaptım ama takvimde bana uyan bir saat bulamadım.`,
  },

  booking: {
    frameTitle: "Görüşme saati seç (Calendly)",
    loading: "Takvim yükleniyor…",
    saving: "Görüşmen kaydediliyor…",
    openDirect: "Takvim açılmadıysa yeni sekmede aç",
    noSlot: "Uygun saat bulamadın mı? WhatsApp'tan yaz",
  },

  thanks: {
    title: (firstName: string | null) => (firstName ? `Görüşmen planlandı, ${firstName}` : "Görüşmen planlandı"),
    lead: "Onay e-postan Calendly'den gönderildi; görüşmeden önce hatırlatma da gelecek.",
    fallbackLead: "Görüşme saatin ve Zoom bağlantın Calendly'den e-postana gönderildi.",
    timeInEmail: "Saat bilgisi onay e-postanda",
    /** Under the date and time; the Zoom link itself is in Calendly's e-mail (and below when already known). */
    callNote: "Görüşme Zoom'dan. Bağlantı onay e-postanda; saatinde tıklaman yeterli.",
    channelNote: "Bilgisayardan tarayıcıyla, telefondan Zoom uygulamasıyla katılabilirsin.",
    join: "Zoom'a katıl",
    host: (name: string) => `Görüşmeci: ${name}.`,
    confirm: "WhatsApp'tan onayla",
    /** `when` like "5 Kasım Çarşamba 14:30" (Türkiye time); null when Calendly did not tell us. */
    confirmText: (when: string | null) =>
      when ? `Merhaba, ${when} görüşmemi onaylıyorum.` : "Merhaba, görüşmemi onaylıyorum.",
    reschedule: "Saati değiştir",
    cancel: "İptal et",
    videoTitle: "Görüşmeden önce bu kısa videoyu izle",
    whatsapp: "WhatsApp'tan yaz",
    whatsappText: "Merhaba, görüşme planladım ve bir sorum var.",
    prepTitle: "Görüşmeye hazırlık",
    prep: [
      "Birkaç dakika önce Zoom bağlantısını aç; sessiz, interneti iyi bir yerde ol.",
      "Mevcut durumunu ve hedefini birkaç cümleyle düşün.",
      "Bütçe ve zaman planını konuşacağız; kafandaki soruları not al.",
      "Görüşmeye karar verici olarak katıl; başkasına danışacaksan o da yanında olsun.",
    ],
  },

  result: {
    title: "Şu an için sana en doğru adım ücretsiz içeriklerimiz",
    lead: "Verdiğin cevaplara göre birebir program şu an senin için doğru zaman olmayabilir. Bunu baştan söylemek, ikimizin de zamanına saygı.",
    quote: "Borçla da başlanır; ben öyle başladım.",
    resourcesTitle: "Buradan başlayabilirsin",
    reapply: (days: number) =>
      `Bütçen veya zamanlaman değiştiğinde ${days} gün sonra tekrar başvurabilirsin. Kapımız açık.`,
  },

  faq: {
    title: "Sık sorulanlar",
    items: [
      {
        q: "Görüşme gerçekten ücretsiz mi?",
        a: "Evet. 30 dakikalık görüşmede mevcut durumunu ve hedefini konuşuyoruz. Program sana uygunsa detayları anlatıyoruz, değilse ücretsiz kaynaklara yönlendiriyoruz.",
      },
      {
        q: "Ücreti ne kadar?",
        a: "Görüşmede, durumuna göre netleştiriyoruz; taksit seçeneği var. Görüşme ücretsiz, satış baskısı yok.",
      },
      {
        q: "Hiç tecrübem yok, başvurabilir miyim?",
        a: "Evet. İlk gün sana bir koç atanıyor ve 3 haftalık ödevli eğitimle temeli birlikte atıyoruz. Önemli olan haftada 5–10 saat ayırabilmen ve öğrenmeye açık olman.",
      },
      {
        q: "Borcum var, başlayabilir miyim?",
        a: "Görüşmede birlikte bakalım. Ben 500 bin lira borçla başladım; önemli olan test bütçesi ve haftada 5–10 saat.",
      },
      {
        q: "Ne kadar bütçe gerekiyor?",
        a: "Ürün testleri ve reklam için gerçekçi bir başlangıç bütçesi gerekir. Başvuruda bunu sormamızın nedeni sana boşa zaman kaybettirmemek; görüşmede durumuna göre netleştiriyoruz.",
      },
      {
        q: "Stok çekmek pahalı mı?",
        a: "Hayır. Ürün tuttuğunda küçük bir parti çekiyorsun; çoğu üründe 200 adetlik ilk stok bir telefon fiyatını geçmiyor. Tutmayan ürün için stok çekilmez.",
      },
      {
        q: "Dropshipping de var mı?",
        a: "Evet. Türkiye'de stoklu, yurt dışında dropshipping; ikisi de öğretiliyor.",
      },
      {
        q: "Tam zamanlı çalışıyorum, yetişebilir miyim?",
        a: "Haftada en az 5–10 saat ayırabiliyorsan evet. Program, işi olan kişilerin akşam ve hafta sonu ilerleyebileceği şekilde kurgulandı.",
      },
      {
        q: "3 ay bitince destek bitiyor mu?",
        a: "Hayır. Eğitim 3 ay; koç desteği ilk ürünün tutana kadar sürüyor. Discord ve eğitim paneli ömür boyu.",
      },
      {
        q: "Koça nasıl ulaşıyorum?",
        a: "Her gün 09:00–21:00 WhatsApp'tan; gerektiğinde Zoom'da ekran paylaşımlı görüşme.",
      },
      {
        q: "Görüşme nasıl yapılıyor?",
        a: "Zoom'dan, 30 dakika. Saati seçince Zoom bağlantısı, onay ve hatırlatma e-postaları Calendly'den gelir; saatini oradaki bağlantıdan tek tıkla değiştirebilirsin.",
      },
      {
        q: "Yurt dışında yaşıyorum, katılabilir miyim?",
        a: "Evet. Takvim saatleri senin saat diliminde gösterilir; görüşmeler Türkçe yapılır.",
      },
      {
        q: "Kazanç garantisi veriyor musunuz?",
        a: "Hayır. Kazanç garantisi vermiyoruz; başarana kadar yanındayız. E-ticarette sonuç ürüne, bütçeye, zamana ve uygulamaya bağlıdır. Garanti veren herkese karşı dikkatli olmanı öneririz.",
      },
    ],
  },

  closing: {
    title: "İster yalnız dene, ister yanında biriyle yürü.",
    text: "30 dakikalık ücretsiz görüşmede durumuna birlikte bakalım. Sana uygun değilse bunu açıkça söyleriz.",
    cta: "30 dk ücretsiz görüşme planla",
  },

  footer: {
    legal: [
      { href: "/kvkk", label: "KVKK Aydınlatma Metni" },
      { href: "/gizlilik", label: "Gizlilik Politikası" },
      { href: "/cerez", label: "Çerez Politikası" },
    ],
    disclaimer:
      "Kazanç garantisi vermiyoruz; başarana kadar yanındayız. E-ticaret risk içerir; sonuç ürüne, bütçeye, zamana ve uygulamaya bağlıdır. Kurucunun satış rakamları kendi mağazalarına aittir ve tipik bir sonucu temsil etmez. Bu site Meta Platforms, Inc. veya Shopify Inc. ile bağlantılı değildir ve onlar tarafından onaylanmamıştır.",
  },

  stickyCta: "30 dk ücretsiz görüşme",

  /** /kaynaklar: where the Instagram videos send people instead of the DMs (entries in content/resources.ts). */
  resources: {
    metaTitle: "Ücretsiz kaynaklar",
    metaDescription:
      "Instagram videolarında bahsettiğim listeler ve rehberler. Videodaki kelimeyi yaz, kaynağı hemen al.",
    bio: ["Videolarda “yoruma yaz” dediğim her şey burada.", "Kelimeyi yaz, kaynağı hemen al. DM beklemene gerek yok."],
    stats: (count: number) => [
      { value: String(count), label: "kaynak" },
      { value: "Ücretsiz", label: "hepsi" },
      { value: "Anında", label: "DM yok" },
    ],
    search: {
      label: "Videoda söylediğim kelimeyi yaz",
      placeholder: "ör. ÜRÜN",
      submit: "Getir",
      noMatch: "Bu kelimeyle bir kaynak bulamadım. Aşağıdakilerden birini seçebilirsin.",
    },
    applyCta: "Görüşmeye başvur",
    instagramCta: "Instagram",
    gridLabel: "Kaynaklar",
    pinned: { title: "Bana uygun mu?", text: "4 soru · 1 dakika" },
    back: "Tüm kaynaklar",
    watchReel: "Videoyu Instagram'da izle",
    download: "İndir",
    open: "Aç",
    more: "Diğer kaynaklar",
    cta: {
      title: "Bunu tek başına deneyebilirsin. Ya da koçunla birlikte, adım adım yaparsın.",
      text: "4 kısa soruya cevap ver. Programa uygunsan 30 dakikalık ücretsiz görüşme için saatini hemen seç; değilse bunu açıkça söyleriz.",
      button: "Uygun muyum, öğren",
    },
  },
} as const;
