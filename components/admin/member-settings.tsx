import { saveMemberSettings } from "@/app/admin/actions";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";

type Member = {
  id: string;
  name: string;
  role: "admin" | "closer";
  active: boolean;
  accepts_bookings: boolean;
};

/** Account settings only: working hours and availability live in Calendly. */
export function MemberSettings({ member, isSelf }: { member: Member; isSelf: boolean }) {
  return (
    <ActionForm action={saveMemberSettings} className="grid gap-5">
      <input type="hidden" name="memberId" value={member.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold">
          Ad soyad
          <input className="field min-h-[44px] py-2" name="name" defaultValue={member.name} required maxLength={80} />
        </label>
        {isSelf ? (
          <p className="grid gap-1.5 text-sm font-semibold">
            Rol
            <span className="font-normal text-muted">Yönetici (kendi rolünü değiştiremezsin)</span>
            <input type="hidden" name="role" value="admin" />
            <input type="hidden" name="active" value="on" />
          </p>
        ) : (
          <label className="grid gap-1.5 text-sm font-semibold">
            Rol
            <select className="field min-h-[44px] py-2" name="role" defaultValue={member.role}>
              <option value="closer">Satış görüşmecisi</option>
              <option value="admin">Yönetici</option>
            </select>
          </label>
        )}
      </div>

      <div className="grid gap-2.5 text-sm">
        {!isSelf && (
          <label className="flex items-center gap-2.5">
            <input type="checkbox" className="check" name="active" defaultChecked={member.active} />
            Hesap aktif (kapatınca açık oturumları da sonlanır)
          </label>
        )}
        <label className="flex items-center gap-2.5">
          <input type="checkbox" className="check" name="acceptsBookings" defaultChecked={member.accepts_bookings} />
          Görüşme yapıyor (Calendly randevuları bu kişiye eşleşir, günlük özet e-postası alır)
        </label>
      </div>

      <div>
        <SubmitButton>Ayarları kaydet</SubmitButton>
      </div>
    </ActionForm>
  );
}
