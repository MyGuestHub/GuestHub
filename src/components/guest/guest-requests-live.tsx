"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiRefreshCw,
  FiRepeat,
  FiSend,
  FiStar,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { playNotificationSound } from "@/lib/notification-sound";

type Request = {
  id: number;
  item_name_en: string;
  item_name_ar: string;
  quantity: number;
  notes: string | null;
  request_status: string;
  created_at: string;
  estimated_duration_minutes?: number | null;
  assigned_to_name?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  cancelled_by_guest?: boolean;
  service_item_id?: number;
};

type Props = {
  token: string;
  lang: "ar" | "en";
  initialRequests: Request[];
};

const statusConfig: Record<
  string,
  { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: { color: "bg-amber-500/15 text-amber-400", icon: FiClock },
  accepted: { color: "bg-blue-500/15 text-blue-400", icon: FiClock },
  in_progress: { color: "bg-indigo-500/15 text-indigo-400", icon: FiLoader },
  completed: { color: "bg-emerald-500/15 text-emerald-400", icon: FiCheckCircle },
  cancelled: { color: "bg-red-500/10 text-red-400", icon: FiXCircle },
};

const statusLabels: Record<string, [string, string]> = {
  pending: ["معلّق", "Pending"],
  accepted: ["مقبول", "Accepted"],
  in_progress: ["قيد التنفيذ", "In Progress"],
  completed: ["مكتمل", "Completed"],
  cancelled: ["ملغى", "Cancelled"],
};

const emojiMap = {
  love: "😍",
  happy: "😊",
  neutral: "😐",
  sad: "😞",
  angry: "😡",
} as const;

/* ═══════════════════════════════════════════════════════════════════════
   Confetti Burst — pure CSS confetti on completion
   ═══════════════════════════════════════════════════════════════════════ */
function ConfettiBurst({ onDone }: { onDone: () => void }) {
  const piecesRef = useRef(
    Array.from({ length: 40 }, (_, i) => {
      const colors = [
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#ec4899",
        "#06b6d4",
      ];
      return {
        id: i,
        color: colors[i % colors.length],
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        size: 4 + Math.random() * 8,
        ratio: Math.random() > 0.5 ? 1 : 0.4,
        round: Math.random() > 0.5,
        rotation: Math.random() * 360,
        duration: 1.2 + Math.random() * 1.5,
      };
    }),
  );

  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {piecesRef.current.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            top: "-10px",
            width: `${p.size}px`,
            height: `${p.size * p.ratio}px`,
            backgroundColor: p.color,
            borderRadius: p.round ? "50%" : "2px",
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Star Rating Inline Widget
   ═══════════════════════════════════════════════════════════════════════ */
function RatingWidget({
  requestId,
  lang,
  existingRating,
  onRated,
}: {
  requestId: number;
  lang: "ar" | "en";
  existingRating?: {
    stars: number;
    emoji: string | null;
    comment: string | null;
  } | null;
  onRated: () => void;
}) {
  const [stars, setStars] = useState(existingRating?.stars ?? 0);
  const [hoverStar, setHoverStar] = useState(0);
  const [emoji, setEmoji] = useState<string | null>(existingRating?.emoji ?? null);
  const [comment, setComment] = useState(existingRating?.comment ?? "");
  const [submitted, setSubmitted] = useState(!!existingRating);
  const [submitting, setSubmitting] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  if (submitted) {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <FiStar
              key={s}
              className={`h-3.5 w-3.5 ${
                s <= stars ? "fill-amber-400 text-amber-400" : "text-slate-300"
              }`}
            />
          ))}
        </div>
        {emoji && (
          <span className="text-sm">
            {emojiMap[emoji as keyof typeof emojiMap]}
          </span>
        )}
        <span className="text-xs text-emerald-400">
          {t("شكراً لتقييمك!", "Thanks for your feedback!")}
        </span>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (stars === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/guest/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          stars,
          emoji,
          comment: comment || null,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        onRated();
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-2 rounded-xl border border-amber-500/15 bg-amber-500/8 px-3 py-3">
      <p className="mb-2 text-xs font-medium text-amber-400">
        {t("كيف كانت تجربتك؟", "How was your experience?")}
      </p>

      {/* Stars */}
      <div className="mb-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHoverStar(s)}
            onMouseLeave={() => setHoverStar(0)}
            onClick={() => setStars(s)}
            className="transition-transform hover:scale-125 active:scale-95"
          >
            <FiStar
              className={`h-7 w-7 transition-colors ${
                s <= (hoverStar || stars)
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Emoji picker */}
      {stars > 0 && (
        <div className="mb-2 flex gap-2">
          {(Object.entries(emojiMap) as [string, string][]).map(
            ([key, icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setEmoji(emoji === key ? null : key)}
                className={`rounded-full p-1.5 text-lg transition-all ${
                  emoji === key
                    ? "scale-110 bg-white/10 shadow-md ring-2 ring-amber-500/40"
                    : "hover:bg-white/5"
                }`}
              >
                {icon}
              </button>
            ),
          )}
        </div>
      )}

      {/* Comment toggle + input */}
      {stars > 0 && (
        <>
          {!showComment ? (
            <button
              type="button"
              onClick={() => setShowComment(true)}
              className="mb-2 text-xs text-amber-400 underline"
            >
              {t("أضف تعليقاً", "Add a comment")}
            </button>
          ) : (
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={2}
              className="mb-2 w-full resize-none rounded-lg border border-white/15 bg-slate-800/60 px-3 py-2 text-xs text-white/90 placeholder:text-white/30 focus:border-amber-500/40 focus:outline-none"
              placeholder={t("أخبرنا المزيد...", "Tell us more...")}
            />
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600 active:scale-95 disabled:opacity-60"
          >
            {submitting ? (
              <FiLoader className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FiSend className="h-3.5 w-3.5" />
            )}
            {t("إرسال التقييم", "Submit Rating")}
          </button>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Cancel Confirmation Modal
   ═══════════════════════════════════════════════════════════════════════ */
function CancelModal({
  lang,
  requestName,
  onConfirm,
  onClose,
}: {
  lang: "ar" | "en";
  requestName: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const handleSubmit = () => {
    setSubmitting(true);
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:rounded-3xl">
        <button
          onClick={onClose}
          className="absolute end-4 top-4 rounded-full p-1.5 text-white/40 transition hover:bg-white/10"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
          <FiAlertTriangle className="h-7 w-7 text-red-400" />
        </div>

        <h3 className="mb-1 text-center text-lg font-bold text-white">
          {t("تأكيد الإلغاء", "Confirm Cancellation")}
        </h3>
        <p className="mb-4 text-center text-sm text-white/60">
          {t(
            `هل أنت متأكد من إلغاء "${requestName}"؟`,
            `Are you sure you want to cancel "${requestName}"?`,
          )}
        </p>

        <label className="mb-1.5 block text-xs font-medium text-white/60">
          {t("سبب الإلغاء (اختياري)", "Reason for cancellation (optional)")}
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          rows={3}
          className="mb-4 w-full resize-none rounded-xl border border-white/15 bg-slate-800/60 px-3 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:border-red-500/40 focus:outline-none"
          placeholder={t(
            "مثال: لم أعد بحاجة لهذه الخدمة",
            "e.g. I no longer need this service",
          )}
        />

        <div className="mb-4 rounded-xl bg-amber-500/10 px-3 py-2.5">
          <p className="text-xs text-amber-400">
            {t(
              "ملاحظة: يمكن إلغاء الطلبات المعلقة والمقبولة فقط. لا يمكن إلغاء الطلبات قيد التنفيذ.",
              "Note: Only pending and accepted requests can be cancelled. In-progress requests cannot be cancelled.",
            )}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            {t("تراجع", "Go Back")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition hover:bg-red-600 disabled:opacity-60"
          >
            {submitting ? (
              <FiLoader className="mx-auto h-5 w-5 animate-spin" />
            ) : (
              t("تأكيد الإلغاء", "Cancel Request")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════ */
export function GuestRequestsLive({ token, lang, initialRequests }: Props) {
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [cancelTarget, setCancelTarget] = useState<Request | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [ratings, setRatings] = useState<
    Map<
      number,
      { stars: number; emoji: string | null; comment: string | null }
    >
  >(new Map());
  const [reorderingId, setReorderingId] = useState<number | null>(null);
  const knownStatusByIdRef = useRef<Map<number, string>>(
    new Map(initialRequests.map((req) => [req.id, req.request_status])),
  );
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  /* deterministic short date — avoids locale ICU mismatch between Node and browser */
  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    const mon = d.getMonth() + 1;
    const day = d.getDate();
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${day}/${mon} ${h}:${m}`;
  };

  // Fetch existing ratings on mount
  useEffect(() => {
    fetch("/api/guest/rating")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.ratings)) {
          const map = new Map<
            number,
            { stars: number; emoji: string | null; comment: string | null }
          >();
          for (const r of data.ratings) {
            map.set(r.service_request_id, {
              stars: r.stars,
              emoji: r.emoji,
              comment: r.comment,
            });
          }
          setRatings(map);
        }
      })
      .catch(() => {});
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/guest/requests?token=${encodeURIComponent(token)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.requests)) {
        const nextRequests = data.requests as Request[];
        const prevStatusById = knownStatusByIdRef.current;
        const nextStatusById = new Map<number, string>();

        let shouldPlaySound = false;
        let newlyCompleted = false;

        for (const req of nextRequests) {
          nextStatusById.set(req.id, req.request_status);
          const oldStatus = prevStatusById.get(req.id);
          if (!oldStatus || oldStatus !== req.request_status) {
            shouldPlaySound = true;
            if (
              req.request_status === "completed" &&
              oldStatus &&
              oldStatus !== "completed"
            ) {
              newlyCompleted = true;
            }
          }
        }

        if (shouldPlaySound) playNotificationSound();
        if (newlyCompleted) setShowConfetti(true);

        knownStatusByIdRef.current = nextStatusById;
        setRequests(nextRequests);
      }
    } catch {
      // ignore network error
    }
  }, [token]);

  useEffect(() => {
    const interval = setInterval(fetchRequests, 5_000);
    const onNewRequest = () => fetchRequests();
    window.addEventListener("guest-request-change", onNewRequest);
    return () => {
      clearInterval(interval);
      window.removeEventListener("guest-request-change", onNewRequest);
    };
  }, [fetchRequests]);

  useEffect(() => {
    if (cancelSuccess === null) return;
    const timer = setTimeout(() => setCancelSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [cancelSuccess]);

  const handleCancelConfirm = async (reason: string) => {
    if (!cancelTarget) return;
    try {
      const res = await fetch("/api/guest/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: cancelTarget.id, reason }),
      });
      if (res.ok) {
        setCancelSuccess(cancelTarget.id);
        fetchRequests();
      }
    } catch {
      // ignore
    } finally {
      setCancelTarget(null);
    }
  };

  const handleReorder = async (r: Request) => {
    if (!r.service_item_id) return;
    setReorderingId(r.id);
    try {
      const form = new FormData();
      form.set("token", token);
      form.set("lang", lang);
      form.set("serviceItemId", String(r.service_item_id));
      form.set("quantity", String(r.quantity));
      if (r.notes) form.set("notes", r.notes);

      const res = await fetch("/api/guest/request", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        window.dispatchEvent(new CustomEvent("guest-request-change"));
      }
    } catch {
      // ignore
    } finally {
      setReorderingId(null);
    }
  };

  const refreshRatings = useCallback(() => {
    fetch("/api/guest/rating")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.ratings)) {
          const map = new Map<
            number,
            { stars: number; emoji: string | null; comment: string | null }
          >();
          for (const rt of data.ratings) {
            map.set(rt.service_request_id, {
              stars: rt.stars,
              emoji: rt.emoji,
              comment: rt.comment,
            });
          }
          setRatings(map);
        }
      })
      .catch(() => {});
  }, []);

  if (requests.length === 0) return null;

  const isCancellable = (status: string) =>
    status === "pending" || status === "accepted";

  return (
    <section className="mb-6">
      {/* Confetti celebration */}
      {showConfetti && (
        <ConfettiBurst onDone={() => setShowConfetti(false)} />
      )}

      {/* Cancel success toast */}
      {cancelSuccess !== null && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <FiCheckCircle className="h-4 w-4 shrink-0" />
          {t("تم إلغاء الطلب بنجاح", "Request cancelled successfully")}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          {t("طلباتي", "My Requests")}
        </h2>
        <button
          onClick={fetchRequests}
          className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white/70"
          aria-label={t("تحديث", "Refresh")}
        >
          <FiRefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        {requests.map((r) => {
          const cfg = statusConfig[r.request_status] ?? statusConfig.pending;
          const Icon = cfg.icon;
          const label = statusLabels[r.request_status];
          const isCancelledByGuest =
            r.request_status === "cancelled" && r.cancelled_by_guest;
          const showCancelBtn = isCancellable(r.request_status);
          const isCompleted = r.request_status === "completed";
          const existingRating = ratings.get(r.id);

          return (
            <div
              key={r.id}
              className={`rounded-2xl border p-3 backdrop-blur-xl transition-all ${
                r.request_status === "cancelled"
                  ? "border-red-500/15 bg-red-500/5"
                  : isCompleted
                    ? "border-emerald-500/15 bg-emerald-500/5"
                    : "border-white/10 bg-slate-900/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <p
                  className={`text-sm font-medium ${
                    r.request_status === "cancelled"
                      ? "text-slate-400 line-through"
                      : ""
                  }`}
                >
                  {lang === "ar" ? r.item_name_ar : r.item_name_en}
                  {r.quantity > 1 ? (
                    <span className="ms-1 text-xs text-slate-400">
                      ×{r.quantity}
                    </span>
                  ) : null}
                </p>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}
                >
                  <Icon className="h-3 w-3" />
                  {label ? t(label[0], label[1]) : r.request_status}
                </span>
              </div>

              {/* Cancelled reason banner */}
              {r.request_status === "cancelled" && r.cancellation_reason && (
                <div className="mt-2 rounded-lg bg-red-500/10 px-3 py-2">
                  <p className="text-xs text-red-400">
                    <span className="font-medium">
                      {isCancelledByGuest
                        ? t("سبب الإلغاء:", "Cancellation reason:")
                        : t(
                            "ألغي بواسطة الفندق:",
                            "Cancelled by hotel:",
                          )}
                    </span>{" "}
                    {r.cancellation_reason}
                  </p>
                </div>
              )}

              {/* Status timeline */}
              {r.request_status !== "cancelled" ? (
                <div className="mt-2 flex items-center gap-1">
                  {["pending", "accepted", "in_progress", "completed"].map(
                    (step, i) => {
                      const steps = [
                        "pending",
                        "accepted",
                        "in_progress",
                        "completed",
                      ];
                      const currentIdx = steps.indexOf(r.request_status);
                      const reached = i <= currentIdx;
                      return (
                        <div
                          key={step}
                          className="flex flex-1 items-center gap-1"
                        >
                          <div
                            className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                              reached
                                ? isCompleted
                                  ? "bg-emerald-500"
                                  : "bg-blue-500"
                                : "bg-slate-700/50"
                            }`}
                          />
                        </div>
                      );
                    },
                  )}
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-1">
                  <div className="h-1.5 w-full rounded-full bg-red-300" />
                </div>
              )}

              <div className="mt-1.5 flex items-center justify-between">
                <p suppressHydrationWarning className="text-[10px] text-slate-400">
                  {fmtDate(r.created_at)}
                </p>
                <div className="flex items-center gap-2">
                  {r.estimated_duration_minutes &&
                  r.request_status !== "completed" &&
                  r.request_status !== "cancelled" ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                      <FiClock className="h-2.5 w-2.5" />~
                      {r.estimated_duration_minutes}
                      {t("د", "m")}
                    </span>
                  ) : null}
                  {r.assigned_to_name &&
                  r.request_status !== "completed" &&
                  r.request_status !== "cancelled" ? (
                    <span className="max-w-[80px] truncate text-[10px] text-slate-400">
                      {r.assigned_to_name}
                    </span>
                  ) : null}
                  {r.notes && r.request_status !== "cancelled" ? (
                    <p className="max-w-[50%] truncate text-[10px] text-slate-400">
                      {r.notes}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Cancel button */}
              {showCancelBtn && (
                <button
                  type="button"
                  onClick={() => setCancelTarget(r)}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 active:scale-[0.98]"
                >
                  <FiXCircle className="h-3.5 w-3.5" />
                  {t("إلغاء الطلب", "Cancel Request")}
                </button>
              )}

              {/* Completed: rating + reorder */}
              {isCompleted && (
                <>
                  <RatingWidget
                    requestId={r.id}
                    lang={lang}
                    existingRating={existingRating}
                    onRated={refreshRatings}
                  />
                  {r.service_item_id && (
                    <button
                      type="button"
                      onClick={() => handleReorder(r)}
                      disabled={reorderingId === r.id}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 py-2 text-xs font-medium text-cyan-400 transition hover:bg-cyan-500/15 active:scale-[0.98] disabled:opacity-60"
                    >
                      {reorderingId === r.id ? (
                        <FiLoader className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FiRepeat className="h-3.5 w-3.5" />
                      )}
                      {t("طلب مجدداً", "Order Again")}
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Cancel modal */}
      {cancelTarget && (
        <CancelModal
          lang={lang}
          requestName={
            lang === "ar"
              ? cancelTarget.item_name_ar
              : cancelTarget.item_name_en
          }
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </section>
  );
}
