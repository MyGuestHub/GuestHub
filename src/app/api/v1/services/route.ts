import { type NextRequest } from "next/server";
import {
  authenticateApiRequest,
  requireScope,
  apiSuccess,
  auditLog,
} from "@/lib/api-auth";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/** GET /api/v1/services — List all service categories with their items */
export async function GET(req: NextRequest) {
  const start = performance.now();
  const authResult = await authenticateApiRequest(req);
  if ("status" in authResult) return authResult;

  const scopeErr = requireScope(authResult, "services.read");
  if (scopeErr) { auditLog(authResult.keyId, req, 403, start); return scopeErr; }

  const categories = await query(
    `SELECT id, slug, name_en, name_ar, icon, is_active
     FROM service_categories WHERE is_active = TRUE ORDER BY sort_order, id`,
    [],
  );

  const items = await query(
    `SELECT si.id, si.category_id, si.slug, si.name_en, si.name_ar,
            si.description_en, si.description_ar,
            si.estimated_cost::text, si.is_active
     FROM service_items si
     JOIN service_categories sc ON sc.id = si.category_id AND sc.is_active = TRUE
     WHERE si.is_active = TRUE
     ORDER BY si.sort_order, si.id`,
    [],
  );

  // Group items under categories
  const result = categories.rows.map((cat: Record<string, unknown>) => ({
    ...cat,
    items: items.rows.filter((item: Record<string, unknown>) => item.category_id === cat.id),
  }));

  auditLog(authResult.keyId, req, 200, start);
  return apiSuccess(result);
}
