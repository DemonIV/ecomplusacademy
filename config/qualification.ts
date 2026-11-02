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
  helper?: string;
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
    helper: "Reklam, ürün testi ve eğitim dahil. Gerçekçi bir plan çıkarmak için soruyoruz.",
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
    title: "Sana uygun bir plan sunarsak 48 saat içinde başlayabilir misin?",
    options: [
      { id: "yes", label: "Evet, hazırım" },
      { id: "installments", label: "Evet, taksit seçeneği olursa" },
      { id: "no", label: "Hayır, şu an başlayamam" },
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

export function answerLabel(questionId: string, optionId: string): string {
  const question = QUESTIONS.find((q) => q.id === questionId);
  return question?.options.find((o) => o.id === optionId)?.label ?? optionId;
}
