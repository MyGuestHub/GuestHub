"use client";

import { useCallback, useEffect, useState } from "react";
import { FiBell, FiBellOff, FiClock, FiSun, FiX } from "react-icons/fi";
import type { AppLang } from "@/lib/i18n";

type WakeUp = { id: number; wake_time: string; wake_date: string; status: string };

type Props = { lang: AppLang };

export function GuestQuickActions({ lang }: Props) {
  const [dnd, setDnd] = useState(false);
  const [dndLoading, setDndLoading] = useState(false);
  const [wakeUp, setWakeUp] = useState<WakeUp | null>(null);
  const [showWakeForm, setShowWakeForm] = useState(false);
  const [wakeTime, setWakeTime] = useState("07:00");
  const [wakeDate, setWakeDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );
  const [wakeLoading, setWakeLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const loadStatus = useCallback(async () => {
    const [dndRes, wakeRes] = await Promise.all([
      fetch(`/api/guest/dnd?lang=${lang}`),
      fetch(`/api/guest/wakeup?lang=${lang}`),
    ]);
    if (dndRes.ok) setDnd((await dndRes.json()).dnd);
    if (wakeRes.ok) setWakeUp((await wakeRes.json()).wakeUp);
  }, [lang]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function toggleDnd() {
    setDndLoading(true);
    const fd = new FormData();
    fd.set("lang", lang);
    fd.set("active", String(!dnd));
    const res = await fetch("/api/guest/dnd", { method: "POST", body: fd });
    const data = await res.json();
    if (data.ok) {
      setDnd(data.dnd);
      showToast(data.message);
    }
    setDndLoading(false);
  }

  async function setWakeUpCall() {
    setWakeLoading(true);
    const fd = new FormData();
    fd.set("lang", lang);
    fd.set("wakeTime", wakeTime);
    fd.set("wakeDate", wakeDate);
    const res = await fetch("/api/guest/wakeup", { method: "POST", body: fd });
    const data = await res.json();
    if (data.ok) {
      showToast(data.message);
      setShowWakeForm(false);
      loadStatus();
    }
    setWakeLoading(false);
  }

  async function cancelWake() {
    if (!wakeUp) return;
    const fd = new FormData();
    fd.set("lang", lang);
    fd.set("action", "cancel");
    fd.set("id", String(wakeUp.id));
    const res = await fetch("/api/guest/wakeup", { method: "POST", body: fd });
    const data = await res.json();
    if (data.ok) { showToast(data.message); setWakeUp(null); }
  }

  return (
    <section className="mb-5 space-y-3">
      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-4 top-16 z-50 mx-auto max-w-sm animate-fade-in rounded-xl bg-slate-800 px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {/* DND Toggle */}
        <button
          onClick={toggleDnd}
          disabled={dndLoading}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
            dnd
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {dnd ? <FiBellOff className="h-4 w-4" /> : <FiBell className="h-4 w-4 text-amber-500" />}
          {dnd ? t("عدم الإزعاج مفعل", "DND is ON") : t("عدم الإزعاج", "Do Not Disturb")}
        </button>

        {/* Wake-Up Call */}
        {wakeUp ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
            <FiSun className="h-4 w-4 text-amber-600" />
            <span className="font-medium text-amber-800">
              {wakeUp.wake_time.slice(0, 5)} — {wakeUp.wake_date}
            </span>
            <button onClick={cancelWake} className="ms-1 text-amber-500 hover:text-amber-700">
              <FiX className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowWakeForm(!showWakeForm)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <FiSun className="h-4 w-4 text-amber-500" />
            {t("منبه الاستيقاظ", "Wake-up Call")}
          </button>
        )}
      </div>

      {/* Wake-up form */}
      {showWakeForm && !wakeUp && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-amber-700">
                <FiClock className="me-1 inline h-3 w-3" />{t("الوقت", "Time")}
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-amber-700">
                {t("التاريخ", "Date")}
              </label>
              <input
                type="date"
                value={wakeDate}
                onChange={(e) => setWakeDate(e.target.value)}
                className="w-full rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm"
              />
            </div>
            <button
              onClick={setWakeUpCall}
              disabled={wakeLoading}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {t("ضبط", "Set")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
