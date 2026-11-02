import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/app/admin/actions";
import { Logo } from "@/components/brand/logo";
import type { SessionUser } from "@/lib/auth/session";
import { formatTrDateTime } from "@/lib/booking/time";

export const STATUS_LABELS: Record<string, string> = {
  disqualified: "Elendi",
  qualified: "Nitelikli",
  booked: "Randevulu",
  attended: "Görüştü",
  no_show: "Gelmedi",
  won: "Satış",
  lost: "Kaybedildi",
  cancelled: "İptal",
};

const STATUS_TONE: Record<string, string> = {
  disqualified: "bg-white/5 text-faint",
  qualified: "bg-success/15 text-success",
  booked: "bg-sky-400/15 text-sky-200",
  attended: "bg-violet-400/15 text-violet-200",
  no_show: "bg-danger/15 text-danger",
  won: "bg-gold/20 text-gold",
  lost: "bg-white/5 text-muted",
  cancelled: "bg-white/5 text-muted",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[status] ?? "bg-white/5"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export const money = (value: number | null | undefined) =>
  value == null ? "–" : `₺${value.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}`;

export const when = (date: Date | null | undefined) => (date ? formatTrDateTime(date, "Europe/Istanbul") : "–");

const NAV = [
  { href: "/admin", label: "Özet" },
  { href: "/admin/leadler", label: "Leadler" },
  { href: "/admin/ajanda", label: "Ajanda" },
  { href: "/admin/ekip", label: "Ekip" },
  { href: "/admin/durum", label: "Durum", admin: true },
];

export function AdminShell({ user, active, children }: { user: SessionUser; active: string; children: ReactNode }) {
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 border-b border-line bg-night/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/admin" aria-label="Panel özeti" className="rounded-lg">
            <Logo eager />
          </Link>
          {/* Phones: the tabs take their own scrollable row under the logo and the user. */}
          <nav
            className="scrollbar-none order-last -mx-1 flex w-full flex-none gap-1 overflow-x-auto px-1 sm:order-none sm:w-auto sm:flex-1"
            aria-label="Panel"
          >
            {NAV.filter((item) => !item.admin || user.role === "admin").map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active === item.href ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap ${
                  active === item.href ? "bg-panel-2 text-paper" : "text-muted hover:text-paper"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            {/* Phones: logo and "Çıkış" share one row, the tabs take the next. */}
            <span className="hidden text-muted sm:inline">{user.name}</span>
            <form action={logout}>
              <button type="submit" className="rounded-lg px-2 py-1 text-muted hover:text-paper">
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[var(--radius-card)] border border-line bg-panel/70 p-5 ${className}`}>
      {title && <h2 className="mb-4 font-display text-[1.02rem] font-medium">{title}</h2>}
      {children}
    </section>
  );
}

export function PageTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 className="font-display text-2xl font-semibold tracking-tight">{children}</h1>
      {aside}
    </div>
  );
}
