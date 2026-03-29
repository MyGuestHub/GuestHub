import { FiCheckCircle, FiClock, FiLoader, FiXCircle } from "react-icons/fi";
import type { ServiceRequestRow } from "@/lib/data";
import { tr, type AppLang } from "@/lib/i18n";

const statusConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { color: "bg-amber-100 text-amber-800", icon: FiClock },
  accepted: { color: "bg-blue-100 text-blue-800", icon: FiClock },
  in_progress: { color: "bg-indigo-100 text-indigo-800", icon: FiLoader },
  completed: { color: "bg-emerald-100 text-emerald-800", icon: FiCheckCircle },
  cancelled: { color: "bg-slate-100 text-slate-500", icon: FiXCircle },
};

export function GuestRequestsList({
  requests,
  lang,
}: {
  requests: ServiceRequestRow[];
  lang: AppLang;
}) {
  const t = (ar: string, en: string) => tr(lang, ar, en);

  const statusLabel = (s: string) => {
    const map: Record<string, [string, string]> = {
      pending: ["معلّق", "Pending"],
      accepted: ["مقبول", "Accepted"],
      in_progress: ["قيد التنفيذ", "In Progress"],
      completed: ["مكتمل", "Completed"],
      cancelled: ["ملغى", "Cancelled"],
    };
    const pair = map[s];
    return pair ? t(pair[0], pair[1]) : s;
  };

  return (
    <div className="space-y-2">
      {requests.map((r) => {
        const cfg = statusConfig[r.request_status] ?? statusConfig.pending;
        const Icon = cfg.icon;
        return (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3"
          >
            <div>
              <p className="text-sm font-medium">
                {lang === "ar" ? r.item_name_ar : r.item_name_en}
                {r.quantity > 1 ? <span className="ms-1 text-xs text-slate-400">×{r.quantity}</span> : null}
              </p>
              <p className="text-xs text-slate-400">
                {new Date(r.created_at).toLocaleDateString(lang === "ar" ? "ar" : "en", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {r.notes ? <p className="mt-1 text-xs text-slate-500">{r.notes}</p> : null}
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
              <Icon className="h-3 w-3" />
              {statusLabel(r.request_status)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
