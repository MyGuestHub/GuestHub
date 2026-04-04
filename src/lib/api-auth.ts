import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { validateApiKey, checkRateLimit, logApiRequest, type ApiKeyAuth } from "@/lib/data";

const API_KEY_HEADER = "x-api-key";
const BEARER_PREFIX = "Bearer ";

/** Available API scopes and their descriptions */
export const API_SCOPES = {
  "rooms.read": "List and view rooms",
  "rooms.write": "Create, update, and delete rooms",
  "guests.read": "List and view guests",
  "guests.write": "Create and update guests",
  "reservations.read": "List and view reservations",
  "reservations.write": "Create, update status, and manage reservations",
  "services.read": "List service categories and items",
  "requests.read": "List and view service requests",
  "requests.write": "Create and update service requests",
  "housekeeping.read": "View housekeeping tasks",
  "housekeeping.write": "Create, assign, and update housekeeping tasks",
  "facilities.read": "View facilities and bookings",
  "facilities.write": "Manage facility bookings",
  "invoices.read": "View invoices",
  "invoices.write": "Create and manage invoices",
} as const;

export type ApiScope = keyof typeof API_SCOPES;

/** Hash an API key with SHA-256 for storage */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

/** Generate a secure random API key: ghk_<48 hex chars> */
export function generateApiKey(): string {
  return `ghk_${crypto.randomBytes(24).toString("hex")}`;
}

/** Extract API key from request headers */
function extractKey(req: NextRequest): string | null {
  // Try X-Api-Key header first
  const headerKey = req.headers.get(API_KEY_HEADER);
  if (headerKey) return headerKey;

  // Try Authorization: Bearer <key>
  const auth = req.headers.get("authorization");
  if (auth?.startsWith(BEARER_PREFIX)) return auth.slice(BEARER_PREFIX.length);

  return null;
}

/** Error response helper */
export function apiError(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
}

export type AuthenticatedApiRequest = {
  keyId: number;
  scopes: string[];
};

/**
 * Authenticate + rate-limit an incoming API request.
 * Returns the auth context or a NextResponse error.
 */
export async function authenticateApiRequest(
  req: NextRequest,
): Promise<AuthenticatedApiRequest | NextResponse> {
  const start = performance.now();
  const rawKey = extractKey(req);

  if (!rawKey) {
    return apiError(401, "MISSING_API_KEY", "Provide API key via X-Api-Key header or Authorization: Bearer <key>");
  }

  // Hash and validate
  const keyHash = hashApiKey(rawKey);
  let auth: ApiKeyAuth | null;
  try {
    auth = await validateApiKey(keyHash);
  } catch {
    return apiError(500, "INTERNAL_ERROR", "Authentication service unavailable");
  }

  if (!auth) {
    return apiError(401, "INVALID_API_KEY", "API key is invalid, expired, or revoked");
  }

  // Rate limiting
  const allowed = await checkRateLimit(auth.id, auth.rate_limit);
  if (!allowed) {
    const elapsed = Math.round(performance.now() - start);
    logApiRequest(auth.id, req.method, req.nextUrl.pathname, 429, getIp(req), req.headers.get("user-agent"), elapsed).catch(() => {});
    return apiError(429, "RATE_LIMIT_EXCEEDED", `Rate limit of ${auth.rate_limit} requests/minute exceeded. Retry after 60s.`);
  }

  return { keyId: auth.id, scopes: auth.scopes };
}

/** Check if the authenticated key has the required scope */
export function requireScope(
  auth: AuthenticatedApiRequest,
  scope: ApiScope,
): NextResponse | null {
  if (!auth.scopes.includes(scope)) {
    return apiError(403, "INSUFFICIENT_SCOPE", `This key lacks the '${scope}' scope`);
  }
  return null;
}

/** Build a successful JSON response with standard headers */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    { data, meta: { timestamp: new Date().toISOString() } },
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
}

/** Extract client IP from request */
export function getIp(req: NextRequest): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? null;
}

/** Log an API request (fire-and-forget) */
export function auditLog(
  keyId: number,
  req: NextRequest,
  statusCode: number,
  startMs: number,
) {
  const elapsed = Math.round(performance.now() - startMs);
  logApiRequest(
    keyId,
    req.method,
    req.nextUrl.pathname,
    statusCode,
    getIp(req),
    req.headers.get("user-agent"),
    elapsed,
  ).catch(() => {});
}
