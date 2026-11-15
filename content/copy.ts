/**
 * All landing-page copy (original Turkish). Anything marked `sample: true`
 * is still waiting for the client's real material — `npm run prelaunch`
 * lists them. Nothing on the page shows a "sample" badge.
 *
 * Meta ad policy and the brief: no income guarantees, no "ayda X kazandım",
 * "pasif gelir" or "3 ayda zengin". The proof is the team's track record
 * (head mentor Tarık Buğra Varol) and the founder's own story; every figure
 * here is one the team stated, none is rounded up.
 * The month name and seat count come from config/site.ts (`COHORT`).
 */

export const COPY = {
  nav: { cta: "Görüşme planla" },

  hero: {
    /** One clause per line; the last one is gold. */
    title: ["E-ticarete", "tek başına değil,", "mentörünle başla."],
    lead: "Baş mentör Tarık Buğra Varol ve ekibiyle ilk ürününü buluyor, test ediyor, satmaya başlıyorsun. Sana uygun mu, 30 dakikalık ücretsiz görüşmede birlikte bakalım.",
    cta: "30 dk ücretsiz görüşme planla",
    trust: ["Başarana kadar destek", "Birebir mentör", "09:00–21:00 WhatsApp"],
    /** Illustration on the globe: stocked in Türkiye, dropshipping abroad. */
    orderCards: [
      { city: "İzmir", product: "Seramik kahve seti", status: "Yeni sipariş" },
      { city: "Berlin", product: "Deri cüzdan", status: "Kargoya verildi" },
      { city: "Londra", product: "El yapımı mum", status: "Teslim edildi" },
    ],
  },

  vsl: {
    caption:
      "Önce bu 2,5 dakikalık videoyu izle: kurucumuz Onur Yeşil programın nasıl işlediğini ve ücretsiz görüşmede neye baktığımızı anlatıyor.",
    unmute: "Sesi aç",
    restart: "Baştan izle",
    play: "Videoyu oynat",
    ended: "Sana uygun olup olmadığını 30 dakikalık ücretsiz görüşmede birlikte netleştirelim.",
  },

  /** Head mentor, the numbers behind the team, the founder and the month's seats. */
  mentor: {
    /** Keep `value` short: it is set in the wide display face, two per row on phones. */
    stats: [
      { value: "₺70M+", label: "e-ticaret cirosu" },
      { value: "Yüzlerce", label: "başarılı öğrenci" },
      { value: "Haftada 3", label: "canlı yayın" },
      { value: "50+", label: "eğitim videosu" },
    ],
    eyebrow: "Baş mentörün",
    lead: "Bugüne kadar yüzlerce başarılı öğrenci yetiştirdi; 70 milyon TL'nin üzerinde e-ticaret cirosu var. Eğitimi o yönetiyor: anlatıp bırakmıyoruz, işi seninle birlikte yapıyoruz.",
    pointsTitle: "Programda seninle birlikte:",
    points: [
      "Ürün listeni tarıyoruz",
      "İlk testini kuruyoruz",
      "Reklam sonuçlarını okuyoruz",
      "İlk ürünün tutana kadar devam ediyoruz",
    ],
    founderText:
      "5 yıldır e-ticarette; kendi mağazalarında 50 milyon TL'nin üzerinde satış yaptı. Ücretsiz görüşmede seni Onur karşılıyor, program boyunca da yanında.",
    /** No-break space keeps "20 kişi" together when the line wraps. */
    capacity: (month: string, seats: number) => `${month} dönemi: ${seats} kişi`,
    capacityText: (seats: number) =>
      `Her öğrenciye birebir zaman ayırıyoruz; bu yüzden ayda en fazla ${seats} kişi alıyoruz.`,
    left: (left: number, seats: number) => `${seats} kişilik dönemde ${left} yer kaldı`,
    cta: "30 dk ücretsiz görüşme planla",
  },

  promises: {
    title: "Neden burada farklı?",
    lead: "Eğitim videosu her yerde var. Video teoridir; mağaza bir mentörle yan yana kurulur.",
    items: [
      {
        id: "support",
        title: "Başarana kadar destek",
        text: "Program 3 ay; destek süreyle bitmiyor. İlk ürünün tutana kadar yanındayız.",
      },
      {
        id: "mentor",
        title: "Birebir mentörlük",
        text: "İlk gün sana bir mentör atanıyor. Listeyi birlikte tarıyor, testi birlikte kuruyor, sonucu birlikte okuyorsunuz.",
      },
      {
        id: "chat",
        title: "09:00–21:00 WhatsApp desteği",
        text: "Takıldığın an yaz; gerektiğinde görüntülü görüşmede ekranı açıp birlikte çözüyoruz.",
      },
      {
        id: "homework",
        title: "3 haftalık ödevli eğitim",
        text: "Video izleyip geçmek yok. Her hafta ödev, her ödev mentör kontrolünden geçiyor.",
      },
      {
        id: "software",
        title: "Ürün bulma yazılımı",
        text: "Ürünü tahminle değil yazılımla buluyorsun; mentörün nasıl kullanılacağını gösteriyor.",
      },
      {
        id: "lifetime",
        title: "Ömür boyu erişim",
        text: "Discord topluluğu ve 50'den fazla videoluk eğitim paneli ömür boyu açık.",
      },
    ],
    footnote: "Türkiye'de stoklu, yurt dışında dropshipping: ikisi de eğitimin içinde.",
  },

  howItWorks: {
    title: "Nasıl işliyor?",
    lead: "Ürün seçiminden kargoya altı adım; her adımı mentörünle birlikte kuruyorsun.",
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

  /**
   * The founder's story, in his own voice: why the academy exists. Only what
   * Onur told us is here. Years, the kind of business that closed and how
   * long the debt took are still missing; add them when he confirms them
   * (real specifics are what make a story like this convincing).
   */
  story: {
    eyebrow: "Kurucunun hikâyesi",
    title: "500 bin lira borçla başladım.",
    paragraphs: [
      "Kurduğum iş battı; geriye yaklaşık 500 bin lira borç kaldı. Maaşla kapanacak bir rakam değildi.",
      "E-ticarete o borçla başladım. Borcun tamamını e-ticaretten kazandığımla kapattım; düğünümü de kimseden borç almadan, kendi kazancımla yaptım.",
      "Beş yılda kendi mağazalarımda 50 milyon liranın üzerinde satış yaptım. Bu yolda en pahalı şeyin ürün ya da reklam olmadığını gördüm: yanlışı sana zamanında söyleyecek birinin olmaması.",
      "Ecom Plus Academy'yi bu yüzden kurduk. Eğitimi, yüzlerce öğrenci yetiştirmiş Tarık Buğra Varol yönetiyor; ben de her öğrencinin yanındayım.",
    ],
    /** Pull quote, shown after the second paragraph. */
    quote: "Lamborghini değil, düğün parası.",
    /** Desktop only (the road). An empty `year` is not shown; fill it in when Onur confirms it. */
    milestones: [
      { year: "", title: "Battım", text: "Kurduğum iş kapandı; geriye yaklaşık 500 bin lira borç kaldı." },
      { year: "", title: "E-ticaret", text: "O borçla başladım." },
      { year: "", title: "Borç kapandı", text: "Tamamını e-ticaretten kazandığımla ödedim." },
      { year: "", title: "Düğün", text: "Kimseden borç almadan, kendi kazancımla." },
      { year: "2025", title: "₺50M+ satış", text: "Kendi mağazalarımda geçilen eşik." },
      { year: "2026", title: "Ecom Plus Academy", text: "Baş mentör Tarık Buğra Varol; ben de her öğrencinin yanındayım." },
    ],
  },

  apply: {
    title: "Ücretsiz strateji görüşmeni planla",
    /** Phones: one line instead of the three numbered steps, so the first question follows the title. */
    mobileLead: "4 kısa soru, 1 dakika. Sonra takvimden sana uyan saati seçiyorsun.",
    steps: ["4 kısa soruyu yanıtla", "İletişim bilgilerini bırak", "Takvimden sana uyan saati seç"],
    promise: "Görüşme ücretsizdir ve satış baskısı yoktur. Sana uygun değilsek bunu açıkça söyleriz.",
    back: "Geri",
    contactTitle: "Sana nasıl ulaşalım?",
    contactLead: "Görüşme Google Meet'ten yapılır; bağlantı, onay ve hatırlatmalar e-postana gelir. Gerekirse WhatsApp'tan yazarız.",
    fields: {
      firstName: { label: "Ad", placeholder: "Adın" },
      lastName: { label: "Soyad", placeholder: "Soyadın" },
      phone: { label: "WhatsApp numaran", placeholder: "05xx xxx xx xx", hint: "Yurt dışındaysan ülke koduyla yaz, örn. +49…" },
      email: { label: "E-posta", placeholder: "ornek@eposta.com" },
      gender: { label: "Cinsiyet" },
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
      firstName: "Adını yaz.",
      lastName: "Soyadını yaz.",
      /** Older browser tabs still send one name field. */
      fullName: "Adını ve soyadını yaz.",
      phone: "Geçerli bir cep telefonu yaz (05xx xxx xx xx).",
      email: "Geçerli bir e-posta adresi yaz.",
      gender: "Cinsiyetini seç.",
      kvkk: "Devam etmek için aydınlatma metnini onaylaman gerekiyor.",
      generic: "Bilgilerin gönderilemedi. Bağlantını kontrol edip tekrar dene.",
    },
    notices: {
      already_booked: {
        title: "Zaten planlanmış bir görüşmen var",
        text: "Calendly'den gelen onay e-postasındaki bağlantıdan saatini görebilir veya değiştirebilirsin.",
      },
      known_customer: {
        title: "Seni zaten tanıyoruz",
        text: "Programdaysan mentörüne WhatsApp'tan yazman yeterli, hemen yardımcı olalım.",
      },
      received: {
        title: "Bilgilerin bize ulaştı",
        text: "Ekibimiz seninle iletişime geçecek.",
      },
    },
    whatsapp: "WhatsApp'tan yaz",
    calendarTitle: (firstName: string) => `Harika ${firstName}, sana uyan saati seç`,
    calendarLead: "Görüşme 30 dakika, Google Meet'ten. Saati seçince bağlantı e-postana gelir.",
    noSlotWhatsappText: (firstName: string) =>
      `Merhaba, ben ${firstName}. Formu doldurdum ama takvimde bana uyan bir saat bulamadım.`,
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
    fallbackLead: "Görüşme saatin ve Google Meet bağlantın Calendly'den e-postana gönderildi.",
    timeInEmail: "Saat bilgisi onay e-postanda",
    /** Under the date and time; the meeting link itself is in Calendly's e-mail (and below when already known). */
    callNote: "Görüşme Google Meet'ten. Bağlantı onay e-postanda; saatinde tıklaman yeterli.",
    channelNote: "Bilgisayardan tarayıcıyla, telefondan Google Meet uygulamasıyla katılabilirsin.",
    join: "Görüşmeye katıl",
    host: (name: string) => `Görüşmeci: ${name}.`,
    confirm: "WhatsApp'tan onayla",
    /** `when` like "5 Kasım Çarşamba 14:30" (Türkiye time); null when Calendly did not tell us. */
    confirmText: (when: string | null) =>
      when ? `Merhaba, ${when} görüşmemi onaylıyorum.` : "Merhaba, görüşmemi onaylıyorum.",
    reschedule: "Saati değiştir",
    cancel: "İptal et",
    videoTitle: "Görüşmeden önce bu kısa videoyu izle",
    /** Card next to the video: who the student will work with. */
    mentorCard: "Programda baş mentörün Tarık Buğra Varol.",
    whatsapp: "WhatsApp'tan yaz",
    whatsappText: "Merhaba, görüşme planladım ve bir sorum var.",
    prepTitle: "Görüşmeye hazırlık",
    prep: [
      "Birkaç dakika önce Google Meet bağlantısını aç; sessiz, interneti iyi bir yerde ol.",
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
      `Bütçen veya zamanlaman değiştiğinde ${days} gün sonra formu tekrar doldurabilirsin. Kapımız açık.`,
  },

  faq: {
    title: "Sık sorulanlar",
    items: [
      {
        q: "Görüşme gerçekten ücretsiz mi?",
        a: "Evet. 30 dakikalık görüşmede mevcut durumunu ve hedefini konuşuyoruz. Program sana uygunsa detayları anlatıyoruz, değilse ücretsiz kaynaklara yönlendiriyoruz.",
      },
      {
        q: "Mentörüm kim olacak?",
        a: "Eğitimi baş mentör Tarık Buğra Varol yönetiyor: bugüne kadar yüzlerce başarılı öğrenci yetiştirdi, 70 milyon TL'nin üzerinde e-ticaret cirosu var. Kurucumuz Onur Yeşil de program boyunca öğrencilerin yanında.",
      },
      {
        q: "Ücreti ne kadar?",
        a: "Görüşmede, durumuna göre netleştiriyoruz; taksit seçeneği var. Görüşme ücretsiz, satış baskısı yok.",
      },
      {
        q: "Hiç tecrübem yok, başlayabilir miyim?",
        a: "Evet. İlk gün sana bir mentör atanıyor ve 3 haftalık ödevli eğitimle temeli birlikte atıyoruz. Önemli olan haftada 5–10 saat ayırabilmen ve öğrenmeye açık olman.",
      },
      {
        q: "Ne kadar bütçe gerekiyor?",
        a: "Eğitim, ürün testleri ve reklam için gerçekçi bir başlangıç bütçesi gerekir. Formda bunu sormamızın nedeni sana boşa zaman kaybettirmemek; görüşmede durumuna göre netleştiriyoruz.",
      },
      {
        q: "Borcum var, başlayabilir miyim?",
        a: "Görüşmede birlikte bakalım. Kurucumuz Onur 500 bin lira borçla başladı; önemli olan gerçekçi bir test bütçesi ve haftada 5–10 saat.",
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
        a: "Hayır. Eğitim 3 ay; mentör desteği ilk ürünün tutana kadar sürüyor. Discord ve eğitim paneli ömür boyu.",
      },
      {
        q: "Mentörüme nasıl ulaşıyorum?",
        a: "Her gün 09:00–21:00 WhatsApp'tan; gerektiğinde ekran paylaşımlı görüntülü görüşme. Ayrıca haftada 3 canlı yayın var.",
      },
      {
        q: "Görüşme nasıl yapılıyor?",
        a: "Google Meet'ten, 30 dakika. Saati seçince bağlantı, onay ve hatırlatma e-postaları Calendly'den gelir; saatini oradaki bağlantıdan tek tıkla değiştirebilirsin.",
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
      "Kazanç garantisi vermiyoruz; başarana kadar yanındayız. E-ticaret risk içerir; sonuç ürüne, bütçeye, zamana ve uygulamaya bağlıdır. Ekibin ciro ve satış rakamları kendi mağazalarına aittir, tipik bir sonucu temsil etmez; öğrenci sonuçları kişiden kişiye değişir. Bu site Meta Platforms, Inc. veya Shopify Inc. ile bağlantılı değildir ve onlar tarafından onaylanmamıştır.",
  },

  stickyCta: "30 dk ücretsiz görüşme",
} as const;
