import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { createSessionToken, verifyPassword } from "@/lib/security";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "gh_session";

export type SessionUser = {
  id: number;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  permissions: string[];
};

type SessionRow = {
  user_id: number;
  username: string;
  full_name: string;
  avatar_url: string | null;
  permission_code: string | null;
};

type UserRow = {
  id: number;
  username: string;
  full_name: string;
  password_hash: string;
  is_active: boolean;
};

export async function authenticateUser(username: string, password: string) {
  const result = await query<UserRow>(
    `
    SELECT id, username, full_name, password_hash, is_active
    FROM app_users
    WHERE username = $1
    LIMIT 1
    `,
    [username],
  );

  if (!result.rowCount) return null;

  const user = result.rows[0];
  if (!user.is_active) return null;
  if (!verifyPassword(password, user.password_hash)) return null;

  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
  };
}

export async function createSession(
  userId: number,
  userAgent: string | null,
  ipAddress: string | null,
) {
  const token = createSessionToken();
  const hours = Number.isFinite(env.SESSION_TTL_HOURS) ? env.SESSION_TTL_HOURS : 24;

  await query(
    `
    INSERT INTO app_sessions (session_token, user_id, expires_at, user_agent, ip_address)
    VALUES ($1, $2, NOW() + ($3::text || ' hours')::interval, $4, $5)
    `,
    [token, userId, String(hours), userAgent, ipAddress],
  );

  return token;
}

export async function deleteSession(sessionToken: string) {
  await query(`DELETE FROM app_sessions WHERE session_token = $1`, [sessionToken]);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const result = await query<SessionRow>(
    `
    SELECT
      u.id AS user_id,
      u.username,
      u.full_name,
      u.avatar_url,
      p.permission_code
    FROM app_sessions s
    JOIN app_users u ON u.id = s.user_id
    LEFT JOIN app_user_roles ur ON ur.user_id = u.id
    LEFT JOIN app_role_permissions rp ON rp.role_id = ur.role_id
    LEFT JOIN app_permissions p ON p.id = rp.permission_id
    WHERE s.session_token = $1
      AND s.expires_at > NOW()
      AND u.is_active = TRUE
    `,
    [token],
  );

  if (!result.rowCount) return null;

  const first = result.rows[0];
  const permissions = Array.from(
    new Set(result.rows.map((row) => row.permission_code).filter(Boolean) as string[]),
  );

  return {
    id: first.user_id,
    username: first.username,
    fullName: first.full_name,
    avatarUrl: first.avatar_url,
    permissions,
  };
}

export function hasPermission(user: SessionUser, permissionCode: string) {
  return user.permissions.includes(permissionCode);
}
