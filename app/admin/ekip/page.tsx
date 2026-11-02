import type { Metadata } from "next";
import { addMember, changeOwnPassword, resetMemberPassword } from "@/app/admin/actions";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { MemberSettings } from "@/components/admin/member-settings";
import { AdminShell, Card, PageTitle, when } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { listMembers } from "@/lib/db/team";

export const instant = false;

export const metadata: Metadata = { title: "Ekip" };

export default async function TeamPage() {
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  const members = (await listMembers()).filter((m) => isAdmin || m.id === user.id);

  return (
    <AdminShell user={user} active="/admin/ekip">
      <PageTitle>Ekip</PageTitle>

      <p className="mb-6 max-w-3xl text-sm text-muted">
        Çalışma saatleri, müsaitlik ve takvim bağlantısı Calendly&apos;de yönetilir. Görüşme yapan herkes panele
        Calendly hesabındaki e-postayla eklenmeli: randevular kişiye bu e-postayla eşleşir.
      </p>

      <div className="grid gap-6">
        {members.map((member) => {
          const self = member.id === user.id;
          return (
            <Card
              key={member.id}
              title={
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {member.name}
                  {self && <span className="text-sm font-normal text-faint">(sen)</span>}
                  <span className="text-sm font-normal text-muted">{member.email}</span>
                  <span className="text-sm font-normal text-muted">
                    {member.role === "admin" ? "Yönetici" : "Satış görüşmecisi"}
                  </span>
                  {!member.active && <span className="text-sm font-normal text-danger">Pasif</span>}
                </span>
              }
            >
              <div className="grid gap-5">
                <p className="-mt-2 text-sm text-faint">
                  {member.accepts_bookings ? "Görüşme yapıyor" : "Görüşme yapmıyor"}, son giriş: {when(member.last_login_at)}
                </p>

                {isAdmin && (
                  <details className="group rounded-xl border border-line p-4">
                    <summary className="cursor-pointer text-sm font-semibold select-none">Hesap ayarları</summary>
                    <div className="mt-5">
                      <MemberSettings
                        member={{
                          id: member.id,
                          name: member.name,
                          role: member.role,
                          active: member.active,
                          accepts_bookings: member.accepts_bookings,
                        }}
                        isSelf={self}
                      />
                    </div>
                  </details>
                )}

                {isAdmin && !self && (
                  <ActionForm
                    action={resetMemberPassword}
                    className="border-t border-line pt-4"
                    confirmText="Eminim, eski şifre ve açık oturumlar geçersiz olsun"
                  >
                    <input type="hidden" name="memberId" value={member.id} />
                    <SubmitButton className="btn btn-ghost btn-sm" pending="Oluşturuluyor…">
                      Yeni geçici şifre oluştur
                    </SubmitButton>
                  </ActionForm>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {isAdmin && (
          <Card title="Ekip üyesi ekle">
            <ActionForm action={addMember} className="grid gap-3">
              <input className="field" name="name" placeholder="Ad soyad" required maxLength={80} autoComplete="off" />
              <input className="field" name="email" type="email" placeholder="E-posta" required autoComplete="off" />
              <select className="field" name="role" defaultValue="closer" aria-label="Rol">
                <option value="closer">Satış görüşmecisi (görüşme yapar, sonuç girer)</option>
                <option value="admin">Yönetici (ekip ve ayarlar)</option>
              </select>
              <div>
                <SubmitButton pending="Ekleniyor…">Ekle ve geçici şifre oluştur</SubmitButton>
              </div>
            </ActionForm>
          </Card>
        )}

        <Card title="Şifreni değiştir">
          <ActionForm action={changeOwnPassword} className="grid gap-3">
            <input
              className="field"
              name="current"
              type="password"
              placeholder="Mevcut şifre"
              required
              autoComplete="current-password"
            />
            <input
              className="field"
              name="next"
              type="password"
              placeholder="Yeni şifre (en az 10 karakter)"
              required
              minLength={10}
              autoComplete="new-password"
            />
            <div>
              <SubmitButton pending="Değiştiriliyor…">Şifreyi değiştir</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      </div>
    </AdminShell>
  );
}
