/**
 * All landing-page copy (original Turkish). Anything marked `sample: true`
 * is placeholder content that must be replaced with the client's real,
 * consented material before launch — `npm run prelaunch` lists them.
 *
 * Meta ad policy: no income guarantees, no "get rich quick" language.
 */

export const COPY = {
  nav: { cta: "Görüşme planla" },

  hero: {
    title: "Türkiye'den dünyaya satan bir e-ticaret markası kur.",
    lead: "Ürün seçiminden mağaza kurulumuna, reklamdan tedarike kadar her adımı birlikte kuruyoruz. Önce 30 dakikalık ücretsiz bir görüşmede sana uygun olup olmadığına birlikte bakalım.",
    cta: "Ücretsiz görüşmeni planla",
    ctaNote: "4 kısa soru, yaklaşık 1 dakika.",
    featured: {
      sample: true,
      quote: "İlk iki ay sadece doğru ürünü test etmeyi öğrendim. Üçüncü ay mağaza kendi reklam bütçesini çıkarmaya başladı.",
      name: "Öğrenci Adı",
      detail: "Programın 4. dönem katılımcısı",
    },
    orderCards: [
      { city: "Berlin", product: "Seramik kahve seti", status: "Yeni sipariş" },
      { city: "Londra", product: "Deri cüzdan", status: "Kargoya verildi" },
      { city: "New York", product: "El yapımı mum", status: "Teslim edildi" },
    ],
  },

  vsl: {
    caption: "Önce bu videoyu izle: sistemin nasıl işlediğini ve kimler için uygun olmadığını anlatıyoruz.",
    unmute: "Sesi aç",
    restart: "Baştan izle",
    play: "Videoyu oynat",
    ended: "Sana uygun olup olmadığını 30 dakikalık ücretsiz görüşmede birlikte netleştirelim.",
  },

  testimonials: {
    title: "Programdan geçenler anlatıyor",
    lead: "Her biri farklı bir başlangıç noktasından geldi. Sonuçlar kişiden kişiye değişir; burada gördüğün sonuçlar garanti değildir.",
    items: [
      { sample: true, name: "Öğrenci Adı", date: "Mart 2026", stage: "Sıfırdan başladı", result: "İlk satış 19. günde" },
      { sample: true, name: "Öğrenci Adı", date: "Şubat 2026", stage: "Tam zamanlı çalışıyor", result: "Akşamları yönetiyor" },
      { sample: true, name: "Öğrenci Adı", date: "Ocak 2026", stage: "Daha önce denemiş", result: "Reklam maliyeti yarıya indi" },
      { sample: true, name: "Öğrenci Adı", date: "Aralık 2025", stage: "Satış yapıyordu", result: "3 yeni ülkeye açıldı" },
      { sample: true, name: "Öğrenci Adı", date: "Kasım 2025", stage: "Sıfırdan başladı", result: "İlk 100 sipariş" },
      { sample: true, name: "Öğrenci Adı", date: "Ekim 2025", stage: "Üniversite öğrencisi", result: "Bursunu kendi çıkarıyor" },
    ],
  },

  founder: {
    sample: true,
    title: "Bu programı neden kurdum?",
    paragraphs: [
      "İlk mağazamı açtığımda elimde bir dizüstü bilgisayar, birkaç video ve çok fazla cesaret vardı. Üç ayda bütçemi bitirdim ve neyi yanlış yaptığımı bile anlamadım.",
      "Sonraki yıllarda bunu deneme yanılmayla, pahalı hatalarla öğrendim. Bu programı, o yolu senin için kısaltmak ve hataları seninle birlikte, küçük bütçelerle yapmak için kurdum.",
    ],
    milestones: [
      { year: "2018", title: "İlk mağaza, ilk kayıp", text: "Yanlış ürün, yanlış hedefleme. Bütçenin tamamı üç ayda gitti." },
      { year: "2019", title: "Veriyle ürün seçimi", text: "Ürün testini sistemleştirdim; ilk karlı kampanya bu dönemde geldi." },
      { year: "2021", title: "Ekip ve tedarik ağı", text: "Avrupa ve ABD'ye düzenli gönderim yapan bir operasyon kurduk." },
      { year: "2023", title: "İlk mentorluk dönemi", text: "Öğrendiklerimi 12 kişilik küçük bir grupla paylaşmaya başladım." },
      { year: "2026", title: "Bugün", text: "Her dönem sınırlı sayıda kişiyle, birebir çalışıyoruz." },
    ],
  },

  results: {
    title: "Öğrencilerin mağaza panellerinden",
    lead: "Ekran görüntüleri öğrencilerin izniyle paylaşılır. Tipik sonuçları değil, mümkün olanı gösterir.",
    stats: [
      { sample: true, value: 1200, suffix: "+", label: "programa katılan öğrenci" },
      { sample: true, value: 38, suffix: "", label: "ülkeye gönderim yapan mağaza" },
      { sample: true, value: 4.8, suffix: "/5", label: "ortalama program puanı", decimals: 1 },
    ],
    chart: {
      sample: true,
      title: "Bir öğrenci mağazasının ilk yılı",
      note: "Aylık ciro, bin ₺",
      months: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
      values: [4, 7, 6, 11, 15, 14, 22, 27, 25, 34, 41, 48],
    },
    /** Placeholder store dashboards; replace with consented screenshots. */
    gallery: [
      { sample: true, store: "Öğrenci mağazası", period: "Son 30 gün", total: "₺184.320", orders: 412, trend: [3, 4, 4, 6, 5, 7, 9, 8, 11, 12] },
      { sample: true, store: "Öğrenci mağazası", period: "Son 30 gün", total: "₺96.540", orders: 233, trend: [2, 3, 2, 4, 5, 4, 6, 7, 7, 9] },
      { sample: true, store: "Öğrenci mağazası", period: "Son 7 gün", total: "₺41.870", orders: 118, trend: [4, 5, 3, 6, 6, 8, 7, 9, 8, 10] },
      { sample: true, store: "Öğrenci mağazası", period: "Son 30 gün", total: "₺263.900", orders: 587, trend: [5, 6, 8, 7, 9, 10, 9, 12, 13, 15] },
      { sample: true, store: "Öğrenci mağazası", period: "Son 30 gün", total: "₺72.410", orders: 164, trend: [1, 2, 2, 3, 3, 5, 4, 6, 6, 8] },
      { sample: true, store: "Öğrenci mağazası", period: "Bugün", total: "₺12.640", orders: 31, trend: [1, 1, 2, 2, 3, 3, 4, 4, 5, 6] },
      { sample: true, store: "Öğrenci mağazası", period: "Son 30 gün", total: "₺138.250", orders: 309, trend: [4, 3, 5, 6, 5, 8, 9, 9, 10, 12] },
    ],
  },

  program: {
    title: "Programa neler dahil?",
    lead: "Tek başına video izlemek yerine, kendi mağazan üzerinde haftalık geri bildirimle ilerliyorsun.",
    items: [
      { id: "mentor", title: "Birebir mentorluk", text: "Haftalık canlı görüşmelerde mağazanı ve reklamlarını birlikte inceliyoruz." },
      { id: "research", title: "Ürün araştırma sistemi", text: "Kazanan ürünü şansa bırakmadan, veriye bakarak seçmeyi öğreniyorsun." },
      { id: "store", title: "Mağaza kurulumu", text: "Shopify mağazanı dönüşüm odaklı şekilde adım adım birlikte kuruyoruz." },
      { id: "ads", title: "Meta reklam stratejisi", text: "Test bütçesinden ölçeklemeye kadar kampanya yapısını birlikte kuruyoruz." },
      { id: "supply", title: "Tedarik ve kargo", text: "Güvenilir tedarikçiler, teslim süreleri ve iade yönetimi için hazır süreçler." },
      { id: "community", title: "Topluluk ve destek", text: "Takıldığında aynı yoldan geçen bir toplulukla ve destek ekibiyle ilerliyorsun." },
    ],
  },

  capacity: {
    title: "Her dönem sınırlı sayıda kişiyle çalışıyoruz",
    text: "Birebir ilgilenebilmek için her ay belirli sayıda yeni katılımcı alıyoruz. Kontenjan dolduğunda başvurular bir sonraki döneme kaydırılır.",
    cta: "Yerimi ayırmak istiyorum",
  },

  apply: {
    title: "Ücretsiz strateji görüşmeni planla",
    steps: ["4 kısa soruyu yanıtla", "İletişim bilgilerini bırak", "Takvimden sana uyan saati seç"],
    promise: "Görüşme ücretsizdir ve satış baskısı yoktur. Sana uygun değilsek bunu açıkça söyleriz.",
    back: "Geri",
    contactTitle: "Sana nasıl ulaşalım?",
    contactLead: "Görüşmeyi bu WhatsApp numarasından yapacağız; onay ve hatırlatma e-postana gelecek.",
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
    calendarLead: "Görüşme 30 dakika sürer. Seçtiğin saatte seni WhatsApp'tan arıyoruz.",
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
    fallbackLead: "Görüşme bilgilerin Calendly'den e-postana gönderildi. Seçtiğin saatte seni WhatsApp'tan arayacağız.",
    timeInEmail: "Saat bilgisi onay e-postanda",
    /** Under the date and time when Calendly's API told us; otherwise the time is only in the e-mail. */
    callNote: (phone: string | null, timeShown: boolean) =>
      `${timeShown ? "Seni bu saatte" : "Seçtiğin saatte seni"} WhatsApp'tan arayacağız${phone ? ` (${phone})` : ""}.`,
    host: (name: string) => `Görüşmeci: ${name}.`,
    reschedule: "Saati değiştir",
    cancel: "İptal et",
    videoTitle: "Görüşmeden önce bu kısa videoyu izle",
    whatsapp: "WhatsApp'tan yaz",
    whatsappText: "Merhaba, görüşme planladım ve bir sorum var.",
    prepTitle: "Görüşmeye hazırlık",
    prep: [
      "Görüşme saatinde WhatsApp'ın açık, internetinin iyi olsun; sessiz bir yerde ol.",
      "Mevcut durumunu ve hedefini birkaç cümleyle düşün.",
      "Bütçe ve zaman planını konuşacağız; kafandaki soruları not al.",
      "Görüşmeye karar verici olarak katıl; başkasına danışacaksan o da yanında olsun.",
    ],
  },

  result: {
    title: "Şu an için sana en doğru adım ücretsiz içeriklerimiz",
    lead: "Verdiğin cevaplara göre birebir program şu an senin için doğru zaman olmayabilir. Bunu baştan söylemek, ikimizin de zamanına saygı.",
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
        q: "Hiç tecrübem yok, başvurabilir miyim?",
        a: "Evet. Katılımcıların önemli bir kısmı sıfırdan başlıyor. Önemli olan haftalık zaman ayırabilmen ve öğrenmeye açık olman.",
      },
      {
        q: "Ne kadar bütçe gerekiyor?",
        a: "Ürün testleri ve reklam için gerçekçi bir başlangıç bütçesi gerekir. Başvuruda bunu sormamızın nedeni sana boşa zaman kaybettirmemek; görüşmede durumuna göre netleştiriyoruz.",
      },
      {
        q: "Tam zamanlı çalışıyorum, yetişebilir miyim?",
        a: "Haftada en az 5–10 saat ayırabiliyorsan evet. Program, işi olan kişilerin akşam ve hafta sonu ilerleyebileceği şekilde kurgulandı.",
      },
      {
        q: "Görüşme nasıl yapılıyor?",
        a: "Seçtiğin saatte seni WhatsApp'tan arıyoruz. Onay ve hatırlatma e-postası Calendly'den gelir; saatini oradaki bağlantıdan tek tıkla değiştirebilirsin.",
      },
      {
        q: "Yurt dışında yaşıyorum, katılabilir miyim?",
        a: "Evet. Takvim saatleri senin saat diliminde gösterilir; görüşmeler Türkçe yapılır.",
      },
      {
        q: "Kazanç garantisi veriyor musunuz?",
        a: "Hayır. E-ticarette sonuç; ürüne, bütçeye, zamana ve uygulamaya bağlıdır. Garanti veren herkese karşı dikkatli olmanı öneririz.",
      },
    ],
  },

  footer: {
    legal: [
      { href: "/kvkk", label: "KVKK Aydınlatma Metni" },
      { href: "/gizlilik", label: "Gizlilik Politikası" },
      { href: "/cerez", label: "Çerez Politikası" },
    ],
    disclaimer:
      "Bu sayfada paylaşılan öğrenci sonuçları kişiseldir ve tipik sonuçları temsil etmez; herhangi bir kazanç garantisi verilmez. E-ticaret risk içerir. Bu site Meta Platforms, Inc. veya Shopify Inc. ile bağlantılı değildir ve onlar tarafından onaylanmamıştır.",
  },

  stickyCta: "Ücretsiz görüşmeni planla",
} as const;
