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
      { id: "established", label: "Oturmuş bir mağazam var", hint: "Aylık 2.500 dolar üzeri ciro" },
    ],
  },
  {
    id: "budget",
    title: "Önümüzdeki 3 ay için ayırabileceğin toplam bütçe ne kadar?",
    helper: "Eğitim, ürün testi ve reklam dahil.",
    note: "Kurucumuz Onur da borçla başladı. Görüşmede bütçene göre gerçekçi bir plan çıkarıyoruz.",
    options: [
      { id: "lt500", label: "0 – 500 dolar" },
      { id: "500_1000", label: "500 – 1.000 dolar" },
      { id: "gt1000", label: "1.000 dolar ve üzeri" },
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

/**
 * Option ids of an earlier version of a question → today's option. A browser
 * tab opened before a deploy may still send the old id; the application is
 * accepted with the matching current answer instead of being rejected.
 */
const RETIRED_OPTION_IDS: Partial<Record<QuestionId, Record<string, string>>> = {
  budget: { lt10: "lt500", "10_25": "lt500", "25_50": "500_1000", "50_100": "gt1000", gt100: "gt1000" },
};

export function currentOptionId(questionId: QuestionId, optionId: unknown): unknown {
  return typeof optionId === "string" ? (RETIRED_OPTION_IDS[questionId]?.[optionId] ?? optionId) : optionId;
}

/** Answers to earlier versions of a question, so older leads still read well in the panel. */
const RETIRED_LABELS: Partial<Record<QuestionId, Record<string, string>>> = {
  budget: {
    lt10: "₺10.000'den az (eski soru)",
    "10_25": "₺10.000 – ₺25.000 (eski soru)",
    "25_50": "₺25.000 – ₺50.000 (eski soru)",
    "50_100": "₺50.000 – ₺100.000 (eski soru)",
    gt100: "₺100.000 ve üzeri (eski soru)",
  },
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

/**
 * Asked with the contact details, not scored. Stored next to the answers
 * (`answers.gender`), so no database change is needed.
 */
export const GENDERS = [
  { id: "male", label: "Erkek" },
  { id: "female", label: "Kadın" },
] as const;

export type GenderId = (typeof GENDERS)[number]["id"];

export function isGender(value: unknown): value is GenderId {
  return GENDERS.some((g) => g.id === value);
}

export function genderLabel(value: unknown): string | null {
  return GENDERS.find((g) => g.id === value)?.label ?? null;
}

/**
 * Follow-up to the lowest budget option: the exact amount, typed in dollars.
 * Whether it is enough for a call is decided on the server
 * (lib/qualification.ts → `minBudgetUsd`), never in the browser. The amount
 * is stored next to the answers (`answers.budget_usd`), like the gender.
 */
export const BUDGET_DETAIL = {
  question: "budget",
  option: "lt500",
  answerKey: "budget_usd",
  label: "Tam olarak ne kadar ayırabilirsin?",
  hint: "Dolar olarak yaz, örn. 450.",
  placeholder: "450",
  /** The option's own upper bound; a larger amount belongs to the next option. */
  max: 500,
  next: "Devam",
  errors: {
    empty: "Tutarı dolar olarak yaz (örn. 450).",
    tooHigh: "500 dolardan fazlaysa yukarıdan bir üst seçeneği seç.",
  },
} as const;

/** "450" or 450 → 450; anything that is not a whole number of dollars → null. */
export function parseBudgetAmount(value: unknown): number | null {
  const text = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  return /^\d{1,6}$/.test(text) ? Number(text) : null;
}

export function budgetAmountLabel(answers: Record<string, string | undefined>): string | null {
  const amount = parseBudgetAmount(answers[BUDGET_DETAIL.answerKey]);
  return amount === null ? null : `${amount} dolar`;
}
