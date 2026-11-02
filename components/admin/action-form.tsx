"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { ActionState } from "@/app/admin/actions";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function SubmitButton({
  children,
  pending: pendingLabel,
  className = "btn btn-gold btn-sm",
  name,
  value,
}: {
  children: ReactNode;
  pending?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} name={name} value={value}>
      {pending ? (pendingLabel ?? "Kaydediliyor…") : children}
    </button>
  );
}

/** Server-action form with inline success / error feedback. */
export function ActionForm({
  action,
  children,
  className,
  confirmText,
  onReset,
  refreshAfter,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  /** Asks before submitting (native confirm is avoided; uses an inline check instead). */
  confirmText?: string;
  /** React resets the form after every action; state mirrored from its fields must follow. */
  onReset?: () => void;
  /** Re-fetches the page this long after a success, for work the action finishes in `after()`. */
  refreshAfter?: number;
}) {
  const [state, formAction] = useActionState(action, null);
  const router = useRouter();

  useEffect(() => {
    if (!state?.ok || !refreshAfter) return;
    const timer = window.setTimeout(() => router.refresh(), refreshAfter);
    return () => window.clearTimeout(timer);
  }, [state, refreshAfter, router]);

  return (
    <form action={formAction} className={className} onReset={onReset}>
      {children}
      {confirmText && (
        <label className="mt-3 flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" required className="check" />
          {confirmText}
        </label>
      )}
      {state && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm ${state.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
          role={state.ok ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
