"use client";

import { useState, Fragment } from "react";
import {
  FiKey,
  FiPlus,
  FiCopy,
  FiTrash2,
  FiXCircle,
  FiCheckCircle,
  FiShield,
  FiClock,
  FiActivity,
  FiEye,
  FiEyeOff,
  FiEdit,
  FiAlertTriangle,
} from "react-icons/fi";

type ApiKey = {
  id: number;
  label: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  request_count: number;
  rate_limit: number;
  created_by_name: string;
  created_at: string;
  revoked_at: string | null;
};

type Props = {
  lang: "ar" | "en";
  keys: ApiKey[];
  newKey?: string;
  basePath: string;
  scopes: Record<string, string>;
};

export function ApiKeysManagement({ lang, keys, newKey, basePath, scopes }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(!!newKey);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scopeEntries = Object.entries(scopes);

  return (
    <div className="space-y-6">
      {/* New key banner — shown only once after creation */}
      {newKey && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 to-orange-500/15 p-5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-500/25 p-2.5">
              <FiAlertTriangle className="h-5 w-5 text-amber-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-200">
                {t("مفتاحك الجديد — انسخه الآن!", "Your New API Key — Copy It Now!")}
              </h3>
              <p className="mt-1 text-xs text-white/60">
                {t(
                  "لن يتم عرض هذا المفتاح مرة أخرى. احفظه في مكان آمن.",
                  "This key will not be shown again. Store it securely.",
                )}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-slate-900/70 px-3 py-2 font-mono text-sm text-emerald-300">
                  {showKey ? newKey : "•".repeat(newKey.length)}
                </code>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="rounded-lg bg-slate-900/50 p-2 text-white/70 transition hover:bg-slate-900/70 hover:text-white"
                >
                  {showKey ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(newKey)}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500/25 px-3 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/35"
                >
                  <FiCopy className="h-4 w-4" />
                  {copied ? t("تم النسخ!", "Copied!") : t("نسخ", "Copy")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-500/30 px-1.5 text-xs font-bold text-cyan-200">
            {keys.length}
          </span>
          <span className="text-sm text-white/60">{t("مفاتيح API", "API Keys")}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/30 to-blue-500/30 px-4 py-2 text-sm font-semibold text-white transition hover:from-cyan-500/40 hover:to-blue-500/40"
        >
          <FiPlus className="h-4 w-4" />
          {t("إنشاء مفتاح جديد", "Create New Key")}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form
          action="/api/admin/api-keys"
          method="post"
          className="rounded-2xl border border-white/15 bg-slate-900/50 p-5 backdrop-blur-sm"
        >
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="action" value="create" />
          <input type="hidden" name="returnTo" value={basePath} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/70">
                {t("الاسم", "Label")}
              </label>
              <input
                name="label"
                required
                maxLength={100}
                placeholder={t("مثال: تطبيق الموبايل", "e.g., Mobile App")}
                className="w-full rounded-xl border border-white/15 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-white/70">
                {t("حد الطلبات/دقيقة", "Rate Limit / min")}
              </label>
              <input
                name="rateLimit"
                type="number"
                defaultValue={60}
                min={1}
                max={1000}
                className="w-full rounded-xl border border-white/15 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-white/70">
                {t("تاريخ الانتهاء (اختياري)", "Expiry Date (optional)")}
              </label>
              <input
                name="expiresAt"
                type="datetime-local"
                className="w-full rounded-xl border border-white/15 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
              />
            </div>
          </div>

          {/* Scopes */}
          <div className="mt-4">
            <label className="mb-2 block text-xs font-medium text-white/70">
              {t("الصلاحيات", "Scopes")}
            </label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {scopeEntries.map(([scope, desc]) => (
                <label
                  key={scope}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 transition hover:border-white/20"
                >
                  <input
                    type="checkbox"
                    name="scope_checkbox"
                    value={scope}
                    className="accent-cyan-400"
                    data-scope
                  />
                  <div>
                    <span className="block text-xs font-semibold text-white">{scope}</span>
                    <span className="block text-[10px] text-white/50">{desc}</span>
                  </div>
                </label>
              ))}
            </div>
            {/* Hidden field to join selected scopes */}
            <input type="hidden" name="scopes" id="scopesHidden" />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
            >
              {t("إلغاء", "Cancel")}
            </button>
            <button
              type="submit"
              onClick={(e) => {
                // Collect checked scopes into hidden field
                const form = (e.target as HTMLButtonElement).closest("form")!;
                const checked = Array.from(form.querySelectorAll<HTMLInputElement>("input[data-scope]:checked"))
                  .map((cb) => cb.value);
                form.querySelector<HTMLInputElement>("#scopesHidden")!.value = checked.join(",");
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40"
            >
              <FiKey className="h-4 w-4" />
              {t("إنشاء المفتاح", "Generate Key")}
            </button>
          </div>
        </form>
      )}

      {/* Keys list */}
      <div className="space-y-3">
        {keys.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/30 px-6 py-12 text-center">
            <FiKey className="mx-auto h-10 w-10 text-white/20" />
            <p className="mt-3 text-sm text-white/50">
              {t("لا توجد مفاتيح API بعد", "No API keys yet")}
            </p>
          </div>
        )}

        {keys.map((k) => {
          const expired = k.expires_at && new Date(k.expires_at) < new Date();
          const isExpanded = expandedId === k.id;
          return (
            <Fragment key={k.id}>
              <div
                className={`rounded-2xl border backdrop-blur-sm transition-all ${
                  !k.is_active || expired
                    ? "border-white/10 bg-slate-900/30 opacity-60"
                    : "border-white/15 bg-slate-900/40"
                }`}
              >
                <div
                  className="flex cursor-pointer items-center gap-4 p-4"
                  onClick={() => setExpandedId(isExpanded ? null : k.id)}
                >
                  {/* Status indicator */}
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      !k.is_active
                        ? "bg-slate-500"
                        : expired
                          ? "bg-rose-500"
                          : "bg-emerald-500 shadow-lg shadow-emerald-500/50"
                    }`}
                  />

                  {/* Label + prefix */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-white">{k.label}</h3>
                      {!k.is_active && (
                        <span className="rounded-md bg-slate-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                          {t("ملغى", "Revoked")}
                        </span>
                      )}
                      {expired && k.is_active && (
                        <span className="rounded-md bg-rose-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">
                          {t("منتهي", "Expired")}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-white/40">{k.key_prefix}•••</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden items-center gap-4 text-xs text-white/50 sm:flex">
                    <div className="flex items-center gap-1">
                      <FiActivity className="h-3.5 w-3.5" />
                      <span>{k.request_count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiShield className="h-3.5 w-3.5" />
                      <span>{k.scopes.length} {t("صلاحية", "scopes")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiClock className="h-3.5 w-3.5" />
                      <span>{k.rate_limit}/m</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {k.is_active && !expired && (
                      <form action="/api/admin/api-keys" method="post">
                        <input type="hidden" name="lang" value={lang} />
                        <input type="hidden" name="action" value="revoke" />
                        <input type="hidden" name="id" value={k.id} />
                        <input type="hidden" name="returnTo" value={basePath} />
                        <button
                          type="submit"
                          className="rounded-lg p-2 text-white/50 transition hover:bg-rose-500/20 hover:text-rose-300"
                          title={t("إلغاء المفتاح", "Revoke Key")}
                        >
                          <FiXCircle className="h-4 w-4" />
                        </button>
                      </form>
                    )}
                    <form action="/api/admin/api-keys" method="post">
                      <input type="hidden" name="lang" value={lang} />
                      <input type="hidden" name="action" value="delete" />
                      <input type="hidden" name="id" value={k.id} />
                      <input type="hidden" name="returnTo" value={basePath} />
                      <button
                        type="submit"
                        className="rounded-lg p-2 text-white/50 transition hover:bg-rose-500/20 hover:text-rose-300"
                        title={t("حذف", "Delete")}
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-white/10 px-4 pb-4 pt-3">
                    <div className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <span className="text-white/40">{t("أنشأ بواسطة", "Created by")}</span>
                        <p className="mt-0.5 font-medium text-white">{k.created_by_name}</p>
                      </div>
                      <div>
                        <span className="text-white/40">{t("تاريخ الإنشاء", "Created")}</span>
                        <p className="mt-0.5 font-medium text-white">
                          {new Date(k.created_at).toLocaleDateString(lang, { year: "numeric", month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <div>
                        <span className="text-white/40">{t("آخر استخدام", "Last used")}</span>
                        <p className="mt-0.5 font-medium text-white">
                          {k.last_used_at
                            ? new Date(k.last_used_at).toLocaleDateString(lang, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                            : t("لم يستخدم بعد", "Never")}
                        </p>
                      </div>
                      <div>
                        <span className="text-white/40">{t("ينتهي", "Expires")}</span>
                        <p className="mt-0.5 font-medium text-white">
                          {k.expires_at
                            ? new Date(k.expires_at).toLocaleDateString(lang, { year: "numeric", month: "short", day: "numeric" })
                            : t("لا ينتهي", "Never")}
                        </p>
                      </div>
                    </div>

                    {/* Scopes */}
                    <div className="mt-3">
                      <span className="text-xs text-white/40">{t("الصلاحيات", "Scopes")}</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {k.scopes.map((s) => (
                          <span
                            key={s}
                            className="rounded-lg bg-cyan-500/15 px-2 py-0.5 text-[11px] font-medium text-cyan-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Usage example */}
                    <div className="mt-4">
                      <span className="text-xs text-white/40">{t("مثال الاستخدام", "Usage Example")}</span>
                      <div className="mt-1.5 rounded-xl bg-slate-950/70 p-3">
                        <code className="block text-xs text-emerald-300">
                          curl -H &quot;X-Api-Key: {k.key_prefix}•••&quot; \
                        </code>
                        <code className="block text-xs text-emerald-300/70">
                          {"  "}{typeof window !== "undefined" ? window.location.origin : ""}/api/v1/rooms
                        </code>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>

      {/* API Documentation */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">
          {t("نقاط الوصول المتاحة", "Available Endpoints")}
        </h3>
        <div className="space-y-2">
          {[
            { method: "GET", path: "/api/v1/rooms", scope: "rooms.read" },
            { method: "GET", path: "/api/v1/rooms/:id", scope: "rooms.read" },
            { method: "POST", path: "/api/v1/rooms", scope: "rooms.write" },
            { method: "PUT", path: "/api/v1/rooms/:id", scope: "rooms.write" },
            { method: "DELETE", path: "/api/v1/rooms/:id", scope: "rooms.write" },
            { method: "GET", path: "/api/v1/guests", scope: "guests.read" },
            { method: "GET", path: "/api/v1/guests/:id", scope: "guests.read" },
            { method: "POST", path: "/api/v1/guests", scope: "guests.write" },
            { method: "PUT", path: "/api/v1/guests/:id", scope: "guests.write" },
            { method: "DELETE", path: "/api/v1/guests/:id", scope: "guests.write" },
            { method: "GET", path: "/api/v1/reservations", scope: "reservations.read" },
            { method: "GET", path: "/api/v1/reservations/:id", scope: "reservations.read" },
            { method: "POST", path: "/api/v1/reservations", scope: "reservations.write" },
            { method: "PUT", path: "/api/v1/reservations/:id", scope: "reservations.write" },
            { method: "DELETE", path: "/api/v1/reservations/:id", scope: "reservations.write" },
            { method: "GET", path: "/api/v1/services", scope: "services.read" },
            { method: "GET", path: "/api/v1/service-requests", scope: "requests.read" },
            { method: "GET", path: "/api/v1/service-requests/:id", scope: "requests.read" },
            { method: "POST", path: "/api/v1/service-requests", scope: "requests.write" },
            { method: "PUT", path: "/api/v1/service-requests/:id", scope: "requests.write" },
            { method: "GET", path: "/api/v1/housekeeping", scope: "housekeeping.read" },
            { method: "GET", path: "/api/v1/housekeeping/:id", scope: "housekeeping.read" },
            { method: "POST", path: "/api/v1/housekeeping", scope: "housekeeping.write" },
            { method: "PUT", path: "/api/v1/housekeeping/:id", scope: "housekeeping.write" },
            { method: "DELETE", path: "/api/v1/housekeeping/:id", scope: "housekeeping.write" },
            { method: "GET", path: "/api/v1/facilities", scope: "facilities.read" },
            { method: "POST", path: "/api/v1/facilities", scope: "facilities.write" },
            { method: "GET", path: "/api/v1/invoices", scope: "invoices.read" },
            { method: "GET", path: "/api/v1/invoices/:id", scope: "invoices.read" },
            { method: "POST", path: "/api/v1/invoices", scope: "invoices.write" },
            { method: "PUT", path: "/api/v1/invoices/:id", scope: "invoices.write" },
          ].map((ep) => {
            const methodColor: Record<string, string> = {
              GET: "bg-emerald-500/25 text-emerald-300",
              POST: "bg-blue-500/25 text-blue-300",
              PUT: "bg-amber-500/25 text-amber-300",
              DELETE: "bg-rose-500/25 text-rose-300",
            };
            return (
            <div key={`${ep.method}-${ep.path}`} className="flex items-center gap-3 rounded-xl bg-slate-900/40 px-3 py-2">
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${methodColor[ep.method] ?? "bg-slate-500/25 text-slate-300"}`}>
                {ep.method}
              </span>
              <code className="flex-1 text-xs text-white/80">{ep.path}</code>
              <span className="rounded bg-cyan-500/15 px-2 py-0.5 text-[10px] text-cyan-300">{ep.scope}</span>
            </div>
            );
          })}
        </div>

        <div className="mt-4 space-y-2">
          <h4 className="text-xs font-semibold text-white/60">{t("المصادقة", "Authentication")}</h4>
          <div className="rounded-xl bg-slate-950/70 p-3">
            <code className="block text-xs text-white/60"># Header</code>
            <code className="block text-xs text-emerald-300">X-Api-Key: ghk_your_key_here</code>
            <code className="mt-2 block text-xs text-white/60"># {t("أو", "or")} Bearer</code>
            <code className="block text-xs text-emerald-300">Authorization: Bearer ghk_your_key_here</code>
          </div>

          <h4 className="mt-3 text-xs font-semibold text-white/60">{t("شكل الاستجابة", "Response Format")}</h4>
          <div className="rounded-xl bg-slate-950/70 p-3">
            <pre className="text-xs text-emerald-300/80">{`{
  "data": [ ... ],
  "meta": { "timestamp": "2026-04-04T..." }
}`}</pre>
          </div>

          <h4 className="mt-3 text-xs font-semibold text-white/60">{t("الأخطاء", "Errors")}</h4>
          <div className="rounded-xl bg-slate-950/70 p-3">
            <pre className="text-xs text-rose-300/80">{`{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit of 60 requests/minute exceeded."
  }
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
