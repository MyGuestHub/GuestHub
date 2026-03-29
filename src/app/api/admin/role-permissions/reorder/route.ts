import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { tx } from "@/lib/db";
import { tr } from "@/lib/i18n";

type Payload = {
  roleId: unknown;
  permissionIds: unknown[];
};

function toInt(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? Math.trunc(value) : Number.NaN;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }
  return Number.NaN;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const lang = (request.headers.get("accept-language") ?? "").toLowerCase().includes("en")
    ? "en"
    : "ar";

  if (!user || !hasPermission(user, "roles.manage")) {
    return NextResponse.json(
      { ok: false, message: tr(lang, "لا تملك صلاحية", "Access denied") },
      { status: 403 },
    );
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json(
      { ok: false, message: tr(lang, "البيانات غير صالحة", "Invalid payload") },
      { status: 400 },
    );
  }

  if (!Array.isArray(payload.permissionIds)) {
    return NextResponse.json(
      { ok: false, message: tr(lang, "البيانات غير صالحة", "Invalid payload") },
      { status: 400 },
    );
  }

  const roleId = toInt(payload.roleId);
  if (!Number.isFinite(roleId) || roleId <= 0) {
    return NextResponse.json(
      { ok: false, message: tr(lang, "الدور غير صالح", "Invalid role") },
      { status: 400 },
    );
  }

  const uniquePermissionIds = Array.from(
    new Set(payload.permissionIds.map(toInt).filter((id) => Number.isFinite(id) && id > 0)),
  );

  await tx(async (client) => {
    await client.query(`DELETE FROM app_role_permissions WHERE role_id = $1`, [roleId]);

    for (let index = 0; index < uniquePermissionIds.length; index += 1) {
      await client.query(
        `
        INSERT INTO app_role_permissions (role_id, permission_id, sort_order)
        VALUES ($1, $2, $3)
        ON CONFLICT (role_id, permission_id)
        DO UPDATE SET sort_order = EXCLUDED.sort_order
        `,
        [roleId, uniquePermissionIds[index], index],
      );
    }
  });

  return NextResponse.json({
    ok: true,
    message: tr(lang, "تم حفظ ترتيب الصلاحيات", "Permissions order saved"),
  });
}
