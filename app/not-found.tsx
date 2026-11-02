import Link from "next/link";
import { Header } from "@/components/sections/header";

export default function NotFound() {
  return (
    <>
      <Header cta={false} />
      <main className="relative grid min-h-[80svh] place-items-center overflow-hidden px-[var(--gutter)] pt-[var(--header-h)]">
        <div className="ambient" />
        <div className="relative max-w-xl">
          <p className="t-num text-6xl text-gold">404</p>
          <h1 className="t-h2 mt-4">Aradığın sayfa burada değil</h1>
          <p className="t-lead mt-4">
            Bağlantı eski veya hatalı olabilir. Görüşme bağlantın çalışmıyorsa onay e-postandaki son bağlantıyı kullan.
          </p>
          <Link href="/" className="btn btn-gold mt-8">
            Ana sayfaya dön
          </Link>
        </div>
      </main>
    </>
  );
}
