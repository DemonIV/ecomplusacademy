"use client";

import { useState } from "react";
import { saveOutcome } from "@/app/admin/actions";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";

const OPTIONS = [
  { id: "attended", label: "Görüşmeye geldi", hint: "Karar bekleniyor" },
  { id: "won", label: "Satış", hint: "Tutar Meta'ya Purchase olarak gider" },
  { id: "lost", label: "Kaybedildi", hint: "Geldi ama almadı" },
  { id: "no_show", label: "Gelmedi", hint: "Görüşmeye katılmadı" },
] as const;

export function OutcomeForm({ leadId, current, amount }: { leadId: string; current: string; amount: number | null }) {
  // Radios stay uncontrolled: React's reset after each save puts them back on what the server now holds,
  // and onReset brings the mirrored choice (which extra field to show) along with them.
  const saved = OPTIONS.some((o) => o.id === current) ? current : "attended";
  const [outcome, setOutcome] = useState<string>(saved);
  return (
    // The CAPI send runs in after(); refresh once more so its status shows up in the event list.
    <ActionForm action={saveOutcome} className="grid gap-4" onReset={() => setOutcome(saved)} refreshAfter={4000}>
      <input type="hidden" name="leadId" value={leadId} />
      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="sr-only">Görüşme sonucu</legend>
        {OPTIONS.map((option) => (
          <label
            key={option.id}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
              outcome === option.id ? "border-gold/60 bg-gold/[0.08]" : "border-line hover:border-line-strong"
            }`}
          >
            <input
              type="radio"
              name="outcome"
              value={option.id}
              defaultChecked={saved === option.id}
              onChange={() => setOutcome(option.id)}
              className="mt-1 accent-[var(--gold)]"
            />
            <span>
              <span className="block font-semibold">{option.label}</span>
              <span className="block text-xs text-muted">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {outcome === "won" && (
        <label className="grid gap-1.5 text-sm font-semibold">
          Satış tutarı (₺, KDV dahil toplam)
          <input
            className="field"
            name="amount"
            inputMode="decimal"
            placeholder="Örn. 45.000"
            defaultValue={amount ? amount.toLocaleString("tr-TR") : undefined}
            required
          />
        </label>
      )}
      {outcome === "lost" && (
        <label className="grid gap-1.5 text-sm font-semibold">
          Neden? <span className="font-normal text-faint">isteğe bağlı</span>
          <input className="field" name="reason" placeholder="Bütçe, zamanlama, düşünecek…" maxLength={300} />
        </label>
      )}
      <div>
        <SubmitButton pending="Kaydediliyor…">Sonucu kaydet</SubmitButton>
      </div>
    </ActionForm>
  );
}
