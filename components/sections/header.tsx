import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { COPY } from "@/content/copy";

export function Header({ cta = true }: { cta?: boolean }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-night/70 backdrop-blur-xl">
      <div className="shell flex h-[var(--header-h)] items-center justify-between gap-3">
        <Link href="/" aria-label="Ana sayfa" className="rounded-lg">
          <Logo eager />
        </Link>
        {cta && (
          <Link href="/#basvuru" className="btn btn-gold btn-sm whitespace-nowrap">
            {COPY.nav.cta}
          </Link>
        )}
      </div>
    </header>
  );
}
