/**
 * Application questions — CLIENT-SAFE part only (ids + labels).
 * Scores, thresholds and disqualifying answers live in
 * `lib/qualification.ts`, which never ships to the browser.
 */

export type QuestionId = "stage" | "budget" | "readiness" | "hours";

export type QuestionOption = {
  id: string;
  label: string;
  hint?: string;
};

export type Question = {
  id: QuestionId;
  title: string;
  /** Under the title. */
  helper?: string;
  /** Under the options. */
  note?: string;
  options: QuestionOption[];
};

export const QUESTIONS: Question[] = [
  {
    id: "stage",
    title: "E-ticarette şu an neredesin?",
    helper: "Doğru cevap yok, görüşmeyi senin seviyene göre hazırlıyoruz.",
    options: [
      { id: "none", label: "Henüz başlamadım", hint: "Sıfırdan mağaza kuracağım" },
      { id: "tried", label: "Denedim, istediğim gibi gitmedi", hint: "Satış gelmedi ya da bıraktım" },
      { id: "selling", label: "Satış yapıyorum", hint: "Düzenli ve ölçeklenebilir hale getirmek istiyorum" },
      { id: "established", label: "Oturmuş bir mağazam var", hint: "Aylık ₺100.000 üzeri ciro" },
    ],
  },
  {
    id: "budget",
    title: "Önümüzdeki 3 ay için ayırabileceğin toplam bütçe ne kadar?",
    helper: "Reklam, ürün testi ve eğitim dahil.",
    note: "Borçla başlayanlar da var; ben öyle başladım. Görüşmede gerçekçi bir plan çıkarıyoruz.",
    options: [
      { id: "lt10", label: "₺10.000'den az" },
      { id: "10_25", label: "₺10.000 – ₺25.000" },
      { id: "25_50", label: "₺25.000 – ₺50.000" },
      { id: "50_100", label: "₺50.000 – ₺100.000" },
      { id: "gt100", label: "₺100.000 ve üzeri" },
    ],
  },
  {
    id: "readiness",
    title: "Uygun olursa ne zaman başlamak istersin?",
    options: [
      { id: "now", label: "Hemen" },
      { id: "this_month", label: "Bu ay" },
      { id: "info_first", label: "Önce bilgi almak istiyorum" },
    ],
  },
  {
    id: "hours",
    title: "Haftada bu işe kaç saat ayırabilirsin?",
    options: [
      { id: "lt5", label: "5 saatten az" },
      { id: "5_10", label: "5 – 10 saat" },
      { id: "10_20", label: "10 – 20 saat" },
      { id: "gt20", label: "20 saatten fazla" },
    ],
  },
];

export type Answers = Record<QuestionId, string>;

export function isValidAnswer(questionId: QuestionId, optionId: unknown): optionId is string {
  const question = QUESTIONS.find((q) => q.id === questionId);
  return Boolean(question?.options.some((o) => o.id === optionId));
}

/** Answers to earlier versions of a question, so older leads still read well in the panel. */
const RETIRED_LABELS: Partial<Record<QuestionId, Record<string, string>>> = {
  readiness: {
    yes: "48 saatte başlayabilir (eski soru)",
    installments: "Taksitle başlayabilir (eski soru)",
    no: "Şu an başlayamaz (eski soru)",
  },
};

export function answerLabel(questionId: string, optionId: string): string {
  const question = QUESTIONS.find((q) => q.id === questionId);
  return (
    question?.options.find((o) => o.id === optionId)?.label ??
    RETIRED_LABELS[questionId as QuestionId]?.[optionId] ??
    optionId
  );
}
