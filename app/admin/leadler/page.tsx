import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell, Card, money, PageTitle, STATUS_LABELS, StatusBadge, when } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { listLeads } from "@/lib/db/leads";
import { formatPhone } from "@/lib/phone";

export const instant = false;

export const metadata: Metadata = { title: "Leadler" };

const PAGE_SIZE = 50;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leadler">) {
  const user = await requireUser();
  const params = await searchParams;
  const status = one(params.durum);
  const search = one(params.q)?.trim().slice(0, 80);
  const page = Math.max(1, Number.parseInt(one(params.s) ?? "1", 10) || 1);

  const { rows, total } = await listLeads({
    status: status && status in STATUS_LABELS ? status : undefined,
    search: search || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { durum: status, q: search, s: String(page), ...patch };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    return `/admin/leadler?${next.toString()}`;
  };

  return (
    <AdminShell user={user} active="/admin/leadler">
      <PageTitle aside={<span className="text-sm text-muted">{total} kayıt</span>}>Leadler</PageTitle>

      <form className="mb-4 flex flex-wrap gap-2" action="/admin/leadler">
        <input
          className="field max-w-xs min-h-[42px] py-2"
          name="q"
          defaultValue={search}
          placeholder="Ad, e-posta veya telefon"
          aria-label="Ara"
        />
        {status && <input type="hidden" name="durum" value={status} />}
        <button type="submit" className="btn btn-ghost btn-sm">
          Ara
        </button>
      </form>

      <div className="scrollbar-none -mx-1 mb-6 flex gap-1 overflow-x-auto px-1 text-sm">
        <Link
          href={link({ durum: undefined, s: undefined })}
          className={`rounded-lg px-3 py-1.5 whitespace-nowrap ${!status ? "bg-panel-2" : "text-muted hover:text-paper"}`}
        >
          Tümü
        </Link>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={link({ durum: key, s: undefined })}
            className={`rounded-lg px-3 py-1.5 whitespace-nowrap ${status === key ? "bg-panel-2" : "text-muted hover:text-paper"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <Card className="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-line text-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Kişi</th>
                <th className="px-3 py-3 font-medium">Durum</th>
                <th className="px-3 py-3 font-medium">Segment</th>
                <th className="px-3 py-3 font-medium">Görüşme</th>
                <th className="px-3 py-3 font-medium">Kampanya</th>
                <th className="px-3 py-3 text-right font-medium">Tutar</th>
                <th className="px-5 py-3 text-right font-medium">Başvuru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
              {rows.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <Link href={`/admin/leadler/${lead.id}`} className="font-semibold hover:text-gold">
                      {lead.full_name}
                    </Link>
                    <span className="flex flex-wrap gap-x-3 text-xs text-muted">
                      <span className="whitespace-nowrap">{formatPhone(lead.phone)}</span>
                      <span>{lead.email}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-3 py-3">
                    {lead.tier ? (
                      <span className="t-num">
                        {lead.tier} <span className="text-faint">({lead.score})</span>
                      </span>
                    ) : (
                      <span className="text-faint">{lead.score}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {lead.next_call_at ? (
                      <>
                        {when(lead.next_call_at)}
                        {lead.host_name && <span className="block text-xs text-faint">{lead.host_name}</span>}
                      </>
                    ) : (
                      "–"
                    )}
                  </td>
                  <td className="max-w-[14rem] truncate px-3 py-3 text-muted" title={lead.utm_content ?? undefined}>
                    {lead.utm_campaign ?? "–"}
                  </td>
                  <td className="t-num px-3 py-3 text-right">{lead.status === "won" ? money(lead.deal_value) : "–"}</td>
                  <td className="px-5 py-3 text-right text-muted">{when(lead.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-3 text-sm" aria-label="Sayfalar">
          {page > 1 && (
            <Link className="btn btn-ghost btn-sm" href={link({ s: String(page - 1) })}>
              Önceki
            </Link>
          )}
          <span className="text-muted">
            {page} / {pages}
          </span>
          {page < pages && (
            <Link className="btn btn-ghost btn-sm" href={link({ s: String(page + 1) })}>
              Sonraki
            </Link>
          )}
        </nav>
      )}
    </AdminShell>
  );
}
