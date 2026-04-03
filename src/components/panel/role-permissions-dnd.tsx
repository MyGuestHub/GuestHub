"use client";

import { useId, useMemo, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiMenu, FiPlus, FiSave, FiTrash2, FiKey, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { AppSelect } from "@/components/ui/app-select";

type AssignedPermission = {
  permission_id: number;
  permission_code: string;
  description: string | null;
};

type Permission = {
  id: number;
  permission_code: string;
  description: string | null;
};

type Props = {
  lang: "ar" | "en";
  roleId: number;
  initialAssigned: AssignedPermission[];
  allPermissions: Permission[];
};

type SortRowProps = {
  item: AssignedPermission;
  onRemove: (id: number) => void;
};

function SortRow({ item, onRemove }: SortRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: String(item.permission_id),
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-xl bg-slate-900/40 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-lg bg-slate-900/50 p-2 text-white/60 hover:bg-slate-900/70 hover:text-white transition"
          type="button"
        >
          <FiMenu className="h-4 w-4" />
        </button>
        <div className="rounded-lg bg-amber-400/20 p-2">
          <FiKey className="h-4 w-4 text-amber-300" />
        </div>
        <div>
          <p className="font-medium text-white">{item.permission_code}</p>
          {item.description && <p className="text-xs text-white/50">{item.description}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.permission_id)}
        className="rounded-lg bg-rose-500/20 p-2 text-rose-300 hover:bg-rose-500/30 transition"
      >
        <FiTrash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

export function RolePermissionsDnd({ lang, roleId, initialAssigned, allPermissions }: Props) {
  const [assigned, setAssigned] = useState<AssignedPermission[]>(initialAssigned);
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const assignedIds = useMemo(() => new Set(assigned.map((p) => p.permission_id)), [assigned]);

  const canAdd = selectedPermissionId && !assignedIds.has(Number(selectedPermissionId));

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = assigned.findIndex((item) => String(item.permission_id) === String(active.id));
    const newIndex = assigned.findIndex((item) => String(item.permission_id) === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    setAssigned((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  function addPermission() {
    if (!canAdd) return;
    const next = allPermissions.find((p) => p.id === Number(selectedPermissionId));
    if (!next) return;
    setAssigned((prev) => [
      ...prev,
      {
        permission_id: next.id,
        permission_code: next.permission_code,
        description: next.description,
      },
    ]);
    setSelectedPermissionId("");
  }

  function removePermission(permissionId: number) {
    setAssigned((prev) => prev.filter((item) => item.permission_id !== permissionId));
  }

  async function saveOrder() {
    try {
      setSaving(true);
      setMessage(null);
      const response = await fetch("/api/admin/role-permissions/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId,
          permissionIds: assigned.map((p) => p.permission_id),
        }),
      });

      const data = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setMessage({ type: "error", text: data.message ?? t("خطا در ذخیره", "Save failed") });
        return;
      }

      setMessage({ type: "success", text: data.message ?? t("ذخیره شد", "Saved") });
    } catch {
      setMessage({ type: "error", text: t("خطا در ارتباط", "Network error") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <AppSelect
          value={selectedPermissionId}
          onChange={(event) => setSelectedPermissionId(event.target.value)}
          className="min-w-56 flex-1"
        >
          <option value="">{t("انتخاب دسترسی", "Select permission")}</option>
          {allPermissions.map((permission) => (
            <option key={permission.id} value={permission.id}>
              {permission.permission_code}
            </option>
          ))}
        </AppSelect>
        <button
          type="button"
          onClick={addPermission}
          disabled={!canAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-900/70 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FiPlus className="h-4 w-4" />
          {t("افزودن", "Add")}
        </button>
        <button
          type="button"
          onClick={saveOrder}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/80 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:opacity-50"
        >
          <FiSave className="h-4 w-4" />
          {saving ? t("در حال ذخیره...", "Saving...") : t("ذخیره ترتیب", "Save order")}
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-white/70">
        <FiKey className="h-4 w-4" />
        <span>
          {assigned.length} {t("دسترسی تعیین شده", "permissions assigned")}
        </span>
      </div>

      {/* Sortable list */}
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={assigned.map((item) => String(item.permission_id))}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2">
            {assigned.length === 0 ? (
              <li className="rounded-xl bg-slate-900/40 px-4 py-8 text-center text-white/50">
                {t("هیچ دسترسی تعیین نشده", "No permissions assigned")}
              </li>
            ) : (
              assigned.map((item) => (
                <SortRow key={item.permission_id} item={item} onRemove={removePermission} />
              ))
            )}
          </ul>
        </SortableContext>
      </DndContext>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-500/20 text-emerald-200"
              : "bg-rose-500/20 text-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <FiCheckCircle className="h-4 w-4" />
          ) : (
            <FiAlertCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}
    </div>
  );
}
