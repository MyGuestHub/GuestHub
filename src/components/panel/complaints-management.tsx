"use client";

import { useCallback, useEffect, useState } from "react";
import { FiAlertTriangle, FiCheck, FiClock, FiUser, FiChevronDown } from "react-icons/fi";

type Complaint = {
  id: number;
  guest_name: string;
  room_number: string | null;
  category: string;
  subject: string;
  description: string;
  severity: string;
  status: string;
  assigned_to_name: string | null;
  resolution: string | null;
  created_at: string;
};

type Props = { lang: string };

const STATUS_OPTIONS = ["open", "investigating", "resolved", "closed"];
const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-500/20 text-amber-300",
  investigating: "bg-blue-500/20 text-blue-300",
  resolved: "bg-emerald-500/20 text-emerald-300",
  closed: "bg-slate-500/20 text-slate-400",
};
const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-300",
  medium: "bg-amber-500/20 text-amber-300",
  high: "bg-orange-500/20 text-orange-300",
  critical: "bg-rose-500/20 text-rose-300 animate-pulse",
};

export function ComplaintsManagement({ lang }: Props) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [resolutionText, setResolutionText] = useState("");

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const load = useCallback(async () => {
    const q = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/complaints${q}`);
    if (res.ok) setComplaints((await res.json()).complaints ?? []);
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 10000); return () => clearInterval(iv); }, [load]);

  async function updateStatus(id: number, status: string) {
    const fd = new FormData();
    fd.set("action", "status");
    fd.set("id", String(id));
    fd.set("status", status);
    if (status === "resolved" && resolutionText) fd.set("resolution", resolutionText);
    await fetch("/api/admin/complaints", { method: "POST", body: fd });
    setResolutionText("");
    load();
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${!filter ? "bg-white/15 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
        >
          {t("الكل", "All")}
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${filter === s ? "bg-white/15 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {complaints.length === 0 && (
          <div className="rounded-2xl bg-slate-900/50 p-10 text-center text-sm text-white/40">
            {t("لا توجد شكاوى", "No complaints")}
          </div>
        )}
        {complaints.map((c) => (
          <div key={c.id} className="rounded-2xl bg-slate-900/60 backdrop-blur-xl overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              className="w-full px-4 py-3 text-start"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${SEVERITY_COLORS[c.severity] ?? ""}`}>
                    <FiAlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{c.subject}</p>
                    <p className="text-xs text-white/50">
                      {c.guest_name} {c.room_number ? `• ${t("غرفة", "Room")} ${c.room_number}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[c.status] ?? ""}`}>
                    {c.status}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${SEVERITY_COLORS[c.severity] ?? ""}`}>
                    {c.severity}
                  </span>
                  <FiChevronDown className={`h-4 w-4 text-white/40 transition ${expandedId === c.id ? "rotate-180" : ""}`} />
                </div>
              </div>
            </button>

            {expandedId === c.id && (
              <div className="border-t border-white/5 px-4 py-3 space-y-3">
                <p className="text-sm text-white/70 whitespace-pre-wrap">{c.description}</p>
                <p className="text-xs text-white/30">
                  <FiClock className="me-1 inline h-3 w-3" />
                  {new Date(c.created_at).toLocaleString(lang === "ar" ? "ar" : "en")}
                </p>
                {c.assigned_to_name && (
                  <p className="text-xs text-white/50">
                    <FiUser className="me-1 inline h-3 w-3" />
                    {t("مسؤول:", "Assigned:")} {c.assigned_to_name}
                  </p>
                )}
                {c.resolution && (
                  <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                    <strong>{t("الحل:", "Resolution:")}</strong> {c.resolution}
                  </div>
                )}

                {c.status !== "closed" && (
                  <div className="flex flex-wrap items-end gap-2">
                    {c.status === "open" && (
                      <button onClick={() => updateStatus(c.id, "investigating")}
                        className="rounded-lg bg-blue-600/30 px-3 py-1.5 text-xs font-medium text-blue-200 hover:bg-blue-600/50">
                        {t("بدء التحقيق", "Investigate")}
                      </button>
                    )}
                    {(c.status === "open" || c.status === "investigating") && (
                      <div className="flex items-end gap-1">
                        <input
                          value={resolutionText}
                          onChange={(e) => setResolutionText(e.target.value)}
                          placeholder={t("الحل…", "Resolution…")}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-400 placeholder:text-white/30"
                        />
                        <button onClick={() => updateStatus(c.id, "resolved")}
                          className="rounded-lg bg-emerald-600/30 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-600/50">
                          <FiCheck className="me-1 inline h-3 w-3" />{t("حل", "Resolve")}
                        </button>
                      </div>
                    )}
                    {c.status === "resolved" && (
                      <button onClick={() => updateStatus(c.id, "closed")}
                        className="rounded-lg bg-slate-600/30 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600/50">
                        {t("إغلاق", "Close")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
