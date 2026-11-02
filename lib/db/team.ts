import "server-only";
import { getDb } from "@/lib/db";
import { isUuid } from "@/lib/db/leads";

export type TeamRole = "admin" | "closer";

/**
 * A panel user. `accepts_bookings` = takes calls: their Calendly bookings are
 * matched to them by e-mail, and they get the daily digest.
 */
export type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: TeamRole;
  session_version: number;
  active: boolean;
  accepts_bookings: boolean;
  last_login_at: Date | null;
  created_at: Date;
};

const MEMBER_COLUMNS = `
  id, email, name, role, session_version, active, accepts_bookings, last_login_at, created_at`;

export async function countMembers(): Promise<number> {
  const db = await getDb();
  const rows = await db.query<{ n: number }>("select count(*)::int as n from team_members");
  return rows[0]?.n ?? 0;
}

export async function getMember(id: string): Promise<TeamMember | null> {
  if (!isUuid(id)) return null;
  const db = await getDb();
  const rows = await db.query<TeamMember>(`select ${MEMBER_COLUMNS} from team_members where id = $1`, [id]);
  return rows[0] ?? null;
}

export async function getMemberCredentials(
  email: string,
): Promise<{ id: string; password_hash: string | null; active: boolean; session_version: number } | null> {
  const db = await getDb();
  const rows = await db.query<{ id: string; password_hash: string | null; active: boolean; session_version: number }>(
    "select id, password_hash, active, session_version from team_members where email = $1",
    [email.trim().toLowerCase()],
  );
  return rows[0] ?? null;
}

export async function listMembers(): Promise<TeamMember[]> {
  const db = await getDb();
  return db.query<TeamMember>(`select ${MEMBER_COLUMNS} from team_members order by created_at asc`);
}

export async function createMember(data: {
  email: string;
  name: string;
  role: TeamRole;
  passwordHash: string;
  acceptsBookings?: boolean;
}): Promise<TeamMember> {
  const db = await getDb();
  const email = data.email.trim().toLowerCase();
  return db.tx(async (q) => {
    const rows = await q.query<TeamMember>(
      `insert into team_members (email, name, role, password_hash, accepts_bookings)
       values ($1, $2, $3, $4, $5) returning ${MEMBER_COLUMNS}`,
      [email, data.name.trim(), data.role, data.passwordHash, data.acceptsBookings ?? false],
    );
    // Calendly calls this person hosted before they had a panel account.
    await q.query("update bookings set host_id = $1, updated_at = now() where host_id is null and host_email = $2", [
      rows[0].id,
      email,
    ]);
    return rows[0];
  });
}

export async function findMemberByEmail(email: string): Promise<TeamMember | null> {
  const db = await getDb();
  const rows = await db.query<TeamMember>(`select ${MEMBER_COLUMNS} from team_members where email = $1`, [
    email.trim().toLowerCase(),
  ]);
  return rows[0] ?? null;
}

export async function updateMember(
  id: string,
  data: Partial<{ name: string; role: TeamRole; active: boolean; acceptsBookings: boolean }>,
): Promise<void> {
  const db = await getDb();
  await db.query(
    `update team_members set
       name = coalesce($2, name),
       role = coalesce($3, role),
       active = coalesce($4, active),
       accepts_bookings = coalesce($5, accepts_bookings),
       session_version = case when $4 = false then session_version + 1 else session_version end,
       updated_at = now()
     where id = $1`,
    [id, data.name ?? null, data.role ?? null, data.active ?? null, data.acceptsBookings ?? null],
  );
}

export async function setPassword(id: string, passwordHash: string): Promise<void> {
  const db = await getDb();
  await db.query(
    "update team_members set password_hash = $2, session_version = session_version + 1, updated_at = now() where id = $1",
    [id, passwordHash],
  );
}

export async function touchLogin(id: string): Promise<void> {
  const db = await getDb();
  await db.query("update team_members set last_login_at = now() where id = $1", [id]);
}
