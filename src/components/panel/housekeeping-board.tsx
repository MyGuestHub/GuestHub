"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FiCheck,
  FiChevronRight,
  FiDroplet,
  FiLoader,
  FiPlus,
  FiTrash2,
  FiX,
} from "react-icons/fi";

type AppLang = "ar" | "en";

type Task = {
  id: number;
  room_id: number;
  room_number: string;
  floor: number | null;
  task_type: string;
  task_status: string;
  priority: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  notes: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
};

type Room = { id: number; room_number: string };
type Staff = { id: number; full_name: string };

type Props = {
  lang: AppLang;
  initialTasks: Task[];
  rooms: Room[];
  staff: Staff[];
};

const columns = ["pending", "in_progress", "done", "verified"] as const;

const columnConfig: Record<
  string,
  { labelAr: string; labelEn: string; color: string; bg: string }
> = {
  pending: {
    labelAr: "في الانتظار",
    labelEn: "Pending",
    color: "text-amber-300",
    bg: "from-amber-500/15 to-amber-600/5",
  },
  in_progress: {
    labelAr: "قيد التنظيف",
    labelEn: "In Progress",
    color: "text-blue-300",
    bg: "from-blue-500/15 to-blue-600/5",
  },
  done: {
    labelAr: "مكتمل",
    labelEn: "Done",
    color: "text-emerald-300",
    bg: "from-emerald-500/15 to-emerald-600/5",
  },
  verified: {
    labelAr: "تم التحقق",
    labelEn: "Verified",
    color: "text-violet-300",
    bg: "from-violet-500/15 to-violet-600/5",
  },
};

const typeLabels: Record<string, [string, string]> = {
  cleaning: ["تنظيف", "Cleaning"],
  turndown: ["ترتيب", "Turndown"],
  inspection: ["تفتيش", "Inspection"],
  deep_clean: ["تنظيف عميق", "Deep Clean"],
};

const priorityConfig: Record<string, { label: [string, string]; dot: string }> = {
  low: { label: ["منخفض", "Low"], dot: "bg-slate-400" },
  normal: { label: ["عادي", "Normal"], dot: "bg-blue-400" },
  high: { label: ["عالي", "High"], dot: "bg-amber-400" },
  urgent: { label: ["عاجل", "Urgent"], dot: "bg-red-500 animate-pulse" },
};

export function HousekeepingBoard({ lang, initialTasks, rooms, staff }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showAddForm, setShowAddForm] = useState(false);
  const [movingId, setMovingId] = useState<number | null>(null);
  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/housekeeping");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const moveTask = async (taskId: number, newStatus: string) => {
    setMovingId(taskId);
    try {
      const res = await fetch("/api/admin/housekeeping", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus }),
      });
      if (res.ok) refresh();
    } catch { /* ignore */ }
    finally { setMovingId(null); }
  };

  const removeTask = async (taskId: number) => {
    try {
      const res = await fetch(`/api/admin/housekeeping?id=${taskId}`, { method: "DELETE" });
      if (res.ok) refresh();
    } catch { /* ignore */ }
  };

  const addTask = async (formData: FormData) => {
    const body = {
      roomId: Number(formData.get("roomId")),
      taskType: formData.get("taskType"),
      priority: formData.get("priority"),
      assignedTo: formData.get("assignedTo") || null,
      notes: formData.get("notes") || null,
    };
    try {
      const res = await fetch("/api/admin/housekeeping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        refresh();
        setShowAddForm(false);
      }
    } catch { /* ignore */ }
  };

  const getNextStatus = (current: string): string | null => {
    const idx = columns.indexOf(current as typeof columns[number]);
    return idx < columns.length - 1 ? columns[idx + 1] : null;
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span className="flex gap-1.5">
            {Object.entries(columnConfig).map(([key, cfg]) => (
              <span key={key} className="flex items-center gap-1">
                <span className={`inline-block h-2 w-2 rounded-full ${cfg.color.replace("text-", "bg-")}`} />
                {tasks.filter((tsk) => tsk.task_status === key).length}
              </span>
            ))}
          </span>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-4 py-2 text-xs font-semibold text-cyan-300 transition hover:from-cyan-500/30 hover:to-blue-500/30"
        >
          <FiPlus className="h-3.5 w-3.5" />
          {t("مهمة جديدة", "New Task")}
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => {
          const cfg = columnConfig[col];
          const colTasks = tasks.filter((tsk) => tsk.task_status === col);
          return (
            <div key={col} className={`rounded-2xl bg-gradient-to-b ${cfg.bg} p-3 backdrop-blur-sm`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className={`text-sm font-semibold ${cfg.color}`}>
                  {t(cfg.labelAr, cfg.labelEn)}
                </h3>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white/60">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-2">
                {colTasks.map((task) => {
                  const tType = typeLabels[task.task_type];
                  const pCfg = priorityConfig[task.priority];
                  const nextStatus = getNextStatus(task.task_status);

                  return (
                    <div
                      key={task.id}
                      className="group rounded-xl bg-slate-900/60 p-3 backdrop-blur-sm transition-all hover:bg-slate-900/80"
                    >
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-white/10 px-2 py-0.5 text-xs font-bold text-white">
                            {task.room_number}
                          </span>
                          {task.floor != null && (
                            <span className="text-[10px] text-white/30">F{task.floor}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`h-2 w-2 rounded-full ${pCfg.dot}`} />
                          <span className="text-[10px] text-white/40">
                            {t(pCfg.label[0], pCfg.label[1])}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-medium text-white/80">
                        {tType ? t(tType[0], tType[1]) : task.task_type}
                      </p>

                      {task.assigned_to_name && (
                        <p className="mt-0.5 text-[10px] text-white/40">
                          → {task.assigned_to_name}
                        </p>
                      )}

                      {task.notes && (
                        <p className="mt-1 truncate text-[10px] text-white/30">{task.notes}</p>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[9px] text-white/20">
                          {new Date(task.created_at).toLocaleTimeString(lang === "ar" ? "ar" : "en", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                          {nextStatus && (
                            <button
                              onClick={() => moveTask(task.id, nextStatus)}
                              disabled={movingId === task.id}
                              className="rounded-lg bg-white/10 p-1.5 text-white/60 transition hover:bg-white/20 hover:text-white disabled:opacity-40"
                              title={t("تقدم", "Advance")}
                            >
                              {movingId === task.id ? (
                                <FiLoader className="h-3 w-3 animate-spin" />
                              ) : (
                                <FiChevronRight className="h-3 w-3" />
                              )}
                            </button>
                          )}
                          {col === "verified" && (
                            <button
                              onClick={() => removeTask(task.id)}
                              className="rounded-lg bg-red-500/10 p-1.5 text-red-400 transition hover:bg-red-500/20"
                              title={t("حذف", "Remove")}
                            >
                              <FiTrash2 className="h-3 w-3" />
                            </button>
                          )}
                          {col === "verified" && (
                            <span className="ms-1">
                              <FiCheck className="h-3 w-3 text-emerald-400" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {colTasks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 py-8 text-center text-xs text-white/20">
                    {t("لا توجد مهام", "No tasks")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                <FiDroplet className="h-5 w-5 text-cyan-400" />
                {t("مهمة جديدة", "New Task")}
              </h3>
              <button onClick={() => setShowAddForm(false)} className="rounded-lg p-1 text-white/40 hover:bg-white/10">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addTask(new FormData(e.currentTarget));
              }}
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">{t("الغرفة", "Room")}</label>
                <select name="roomId" required className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white">
                  <option value="">{t("اختر غرفة", "Select room")}</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.room_number}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/60">{t("النوع", "Type")}</label>
                  <select name="taskType" required className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white">
                    {Object.entries(typeLabels).map(([key, lbl]) => (
                      <option key={key} value={key}>{t(lbl[0], lbl[1])}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/60">{t("الأولوية", "Priority")}</label>
                  <select name="priority" required className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white">
                    {Object.entries(priorityConfig).map(([key, cfg]) => (
                      <option key={key} value={key}>{t(cfg.label[0], cfg.label[1])}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">{t("المسؤول", "Assign To")}</label>
                <select name="assignedTo" className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white">
                  <option value="">{t("بدون تعيين", "Unassigned")}</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-white/60">{t("ملاحظات", "Notes")}</label>
                <input
                  name="notes"
                  type="text"
                  maxLength={500}
                  className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-white/30"
                  placeholder={t("اختياري...", "Optional...")}
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/30"
              >
                {t("إنشاء المهمة", "Create Task")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
