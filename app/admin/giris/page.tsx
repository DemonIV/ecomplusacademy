import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { login, setupAdmin } from "@/app/admin/actions";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { Logo } from "@/components/brand/logo";
import { getSessionUser } from "@/lib/auth/session";
import { countMembers } from "@/lib/db/team";
import { env } from "@/lib/env";

export const instant = false;

export const metadata: Metadata = { title: "Giriş" };

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/admin");
  const firstRun = (await countMembers()) === 0;

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden px-4 py-16">
      <div className="ambient" />
      <div className="relative w-full max-w-sm">
        <Logo variant="stacked" eager className="mx-auto w-48" />
        {firstRun ? (
          <>
            <h1 className="mt-8 font-display text-2xl font-semibold">İlk yönetici hesabı</h1>
            <p className="mt-2 text-muted">
              {env.adminSetupToken()
                ? "Kurulum kodunu (ADMIN_SETUP_TOKEN) ve kendi bilgilerini gir."
                : "Önce ortam değişkenlerine ADMIN_SETUP_TOKEN ekle, sonra bu sayfayı yenile."}
            </p>
            <ActionForm action={setupAdmin} className="mt-6 grid gap-3">
              <input className="field" name="token" type="password" placeholder="Kurulum kodu" required autoComplete="off" />
              <input className="field" name="name" placeholder="Ad soyad" required autoComplete="name" />
              <input className="field" name="email" type="email" placeholder="E-posta" required autoComplete="email" />
              <input
                className="field"
                name="password"
                type="password"
                placeholder="Şifre (en az 10 karakter)"
                required
                minLength={10}
                autoComplete="new-password"
              />
              <SubmitButton className="btn btn-gold mt-2" pending="Oluşturuluyor…">
                Hesabı oluştur
              </SubmitButton>
            </ActionForm>
          </>
        ) : (
          <>
            <h1 className="mt-8 font-display text-2xl font-semibold">Panele giriş</h1>
            <ActionForm action={login} className="mt-6 grid gap-3">
              <input className="field" name="email" type="email" placeholder="E-posta" required autoComplete="email" />
              <input
                className="field"
                name="password"
                type="password"
                placeholder="Şifre"
                required
                autoComplete="current-password"
              />
              <SubmitButton className="btn btn-gold mt-2" pending="Giriş yapılıyor…">
                Giriş yap
              </SubmitButton>
            </ActionForm>
          </>
        )}
      </div>
    </main>
  );
}
