import { BRAND } from "@/content/brand";

/**
 * DRAFT legal texts, written to match what this codebase actually
 * collects and where it sends it. They are a starting point for the
 * client's lawyer, not legal advice: `sample: true` keeps them flagged by
 * `npm run prelaunch` until the reviewed versions replace them.
 */

export type LegalDoc = {
  sample: boolean;
  title: string;
  updated: string;
  intro: string;
  sections: Array<{ heading: string; body: string[] }>;
};

const controller = BRAND.legalReady
  ? `${BRAND.legalName} (${BRAND.contact.address}, MERSİS: ${BRAND.contact.mersis}, e-posta: ${BRAND.contact.email})`
  : `${BRAND.name} (e-posta: ${BRAND.contact.email})`;

export const KVKK: LegalDoc = {
  sample: true,
  title: "KVKK Aydınlatma Metni",
  updated: "Taslak, hukuk onayı bekliyor",
  intro: `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca veri sorumlusu sıfatıyla ${controller}, başvuru ve görüşme planlama sürecinde işlediği kişisel veriler hakkında sizi bilgilendirir.`,
  sections: [
    {
      heading: "İşlenen kişisel veriler",
      body: [
        "Kimlik ve iletişim: ad, soyad, cinsiyet, telefon numarası, e-posta adresi, isteğe bağlı Instagram kullanıcı adı.",
        "Başvuru bilgileri: e-ticaret deneyimi, ayırabileceğiniz bütçe aralığı (en düşük aralıkta yazdığınız tutar), başlama zamanı ve haftalık zaman tercihlerinize verdiğiniz cevaplar ile bunlardan hesaplanan uygunluk değerlendirmesi.",
        "Görüşme bilgileri: seçtiğiniz görüşme tarihi ve saati, görüşmenin sonucu ve görüşmeyi yapan ekip üyesinin notları.",
        "İşlem güvenliği: IP adresi, tarayıcı ve cihaz bilgisi, başvuru zamanı.",
        "Pazarlama ve ölçüm (yalnızca çerez onayınız veya açık rızanız olduğunda): reklam tıklama kimliği (fbclid), Meta çerez kimlikleri (_fbc, _fbp) ve sayfaya geliş kaynağı (UTM parametreleri).",
      ],
    },
    {
      heading: "İşleme amaçları ve hukuki sebepler",
      body: [
        "Başvurunuzun değerlendirilmesi, size uygun bir görüşmenin planlanması, onay ve hatırlatma mesajlarının gönderilmesi: bir sözleşmenin kurulmasıyla doğrudan ilgili olması (KVKK m. 5/2-c).",
        "Kötüye kullanımın ve otomatik (bot) başvuruların önlenmesi, hizmet güvenliği: meşru menfaat (KVKK m. 5/2-f).",
        "Hukuki yükümlülüklerin yerine getirilmesi ve olası uyuşmazlıklarda delil: KVKK m. 5/2-ç ve 5/2-e.",
        "Reklamlarımızın etkinliğinin ölçülmesi için iletişim bilgilerinizin şifrelenmiş (SHA-256 ile özetlenmiş) olarak Meta Platforms ile paylaşılması: yalnızca formda vereceğiniz açık rıza (KVKK m. 5/1).",
      ],
    },
    {
      heading: "Aktarılan taraflar",
      body: [
        "Hizmetin sunulması için çalıştığımız tedarikçiler: barındırma (Vercel Inc.), veritabanı (Neon Inc., AB/Frankfurt sunucusu), görüşme randevusu ile onay ve hatırlatma e-postaları (Calendly LLC, ABD), görüşmenin yapıldığı Google Meet (Google LLC, ABD), sizinle yazıştığımız WhatsApp (WhatsApp LLC / Meta Platforms), satış ekibinin başvuru takip tablosu (Airtable / Formagrid Inc., ABD), ekip içi bildirim e-postaları (Resend Inc.).",
        "Açık rızanız varsa reklam ölçümü için Meta Platforms Ireland Ltd.",
        "Bu tedarikçilerin bir kısmı verileri yurt dışındaki sunucularda işler. Yurt dışına aktarım KVKK m. 9 kapsamındaki şartlara uygun olarak yapılır.",
      ],
    },
    {
      heading: "Saklama süresi",
      body: [
        "Görüşme planlanmayan veya program için uygun bulunmayan başvurular son başvuru tarihinden itibaren 12 ay, programa katılanların verileri sözleşme ilişkisi ve yasal saklama süreleri boyunca saklanır; süre sonunda silinir veya anonim hale getirilir.",
      ],
    },
    {
      heading: "Haklarınız",
      body: [
        "KVKK m. 11 uyarınca verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, amacına uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini, silinmesini veya yok edilmesini isteme, otomatik sistemlerle analiz sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme ve zarara uğramanız halinde zararın giderilmesini talep etme haklarına sahipsiniz.",
        `Başvurularınızı ${BRAND.contact.email} adresine iletebilirsiniz. Talepleriniz en geç 30 gün içinde ücretsiz olarak yanıtlanır.`,
      ],
    },
    {
      heading: "Açık rızanın geri alınması",
      body: [
        `Reklam ölçümüne ilişkin açık rızanızı dilediğiniz zaman ${BRAND.contact.email} adresine yazarak geri alabilirsiniz. Geri alma, önceki işlemlerin hukuka uygunluğunu etkilemez.`,
      ],
    },
  ],
};

export const PRIVACY: LegalDoc = {
  sample: true,
  title: "Gizlilik Politikası",
  updated: "Taslak, hukuk onayı bekliyor",
  intro: `${BRAND.name} olarak bu sitede paylaştığınız bilgileri yalnızca başvurunuzu değerlendirmek, görüşmenizi planlamak ve hizmetimizi geliştirmek için kullanırız.`,
  sections: [
    {
      heading: "Topladığımız bilgiler",
      body: [
        "Başvuru formunda verdiğiniz bilgiler ve cevaplar, seçtiğiniz görüşme saati ve sitede gezinmenize ait teknik bilgiler. Ayrıntılı liste KVKK Aydınlatma Metni'nde yer alır.",
      ],
    },
    {
      heading: "Nasıl kullanıyoruz",
      body: [
        "Görüşmenizi planlamak ve hatırlatmak, size uygun olmayan bir programa zaman harcamanızı önlemek, sahte başvuruları ayıklamak ve reklamlarımızın hangi kanaldan sonuç verdiğini ölçmek için.",
        "Bilgilerinizi satmayız. Görüşme hatırlatmaları dışında, açık izniniz olmadan size ticari elektronik ileti göndermeyiz.",
      ],
    },
    {
      heading: "Güvenlik",
      body: [
        "Bağlantılar şifrelidir (HTTPS). Takvim erişim anahtarları veritabanında şifreli saklanır, yönetim paneline yalnızca yetkili ekip üyeleri erişebilir.",
      ],
    },
    {
      heading: "İletişim",
      body: [`Sorularınız için: ${BRAND.contact.email}`],
    },
  ],
};

export const COOKIES: LegalDoc = {
  sample: true,
  title: "Çerez Politikası",
  updated: "Taslak, hukuk onayı bekliyor",
  intro: "Bu sitede zorunlu çerezler her zaman, ölçüm ve pazarlama çerezleri ise yalnızca tercihinize göre kullanılır. Tercihinizi sayfanın altındaki çerez bildiriminden verebilir, tarayıcınızdan çerezleri silerek yeniden seçebilirsiniz.",
  sections: [
    {
      heading: "Zorunlu çerezler",
      body: [
        "fx_consent: çerez tercihinizi hatırlar (6 ay).",
        "fx_admin ve fx_g_state: yalnızca yönetim panelinde oturum açan ekip üyeleri için oturum ve takvim bağlama çerezleri (7 gün / 10 dakika).",
      ],
    },
    {
      heading: "Ölçüm ve pazarlama çerezleri (onayınızla)",
      body: [
        "_fbp ve _fbc (Meta Pixel): reklamlarımızın hangi ziyaretlerle sonuçlandığını ölçer (90 gün).",
        "fx_ft ve fx_lt: siteye ilk ve son geldiğiniz reklam kaynağını (UTM parametreleri) hatırlar (90 gün).",
        "Microsoft Clarity (etkinse): sayfa kullanımını anonim ısı haritalarıyla ölçer.",
      ],
    },
    {
      heading: "Tarayıcı depolaması",
      body: [
        "Başvuru formundaki cevaplarınız, sayfayı yenilediğinizde kaybolmaması için yalnızca bu sekmenin oturum belleğinde (sessionStorage) tutulur ve sekmeyi kapattığınızda silinir.",
      ],
    },
  ],
};
