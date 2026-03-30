"use client";

import { useId, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiMove } from "react-icons/fi";

export type ReservationStatus = "booked" | "checked_in" | "checked_out" | "cancelled";

export type ReservationBoardItem = {
  id: number;
  guest_name: string;
  room_number: string;
  check_in: string;
  check_out: string;
  reservation_status: ReservationStatus;
  sort_order: number;
};

type Props = {
  lang: "ar" | "en";
  initialItems: ReservationBoardItem[];
  onItemsChange?: (items: ReservationBoardItem[]) => void;
};

function labels(lang: "ar" | "en") {
  if (lang === "ar") {
    return {
      booked: "محجوز",
      checked_in: "مسجل دخول",
      checked_out: "منتهي",
      cancelled: "ملغي",
      saving: "در حال به‌روزرسانی...",
      saved: "به‌روزرسانی شد",
      failed: "خطا در به‌روزرسانی",
    };
  }
  return {
    booked: "Booked",
    checked_in: "Checked in",
    checked_out: "Checked out",
    cancelled: "Cancelled",
    saving: "Updating...",
    saved: "Updated",
    failed: "Update failed",
  };
}

const statuses: ReservationStatus[] = ["booked", "checked_in", "checked_out", "cancelled"];

type SortCardProps = {
  item: ReservationBoardItem;
  dragOverlay?: boolean;
};

function SortCard({ item, dragOverlay = false }: SortCardProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(item.id),
    disabled: dragOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-700 ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{item.guest_name}</p>
          <p className="text-xs text-slate-400">#{item.room_number}</p>
        </div>
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing rounded-lg border border-slate-300 p-1 text-slate-400"
        >
          <FiMove className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-400">{new Date(item.check_in).toLocaleString()}</p>
      <p className="text-xs text-slate-500">{new Date(item.check_out).toLocaleString()}</p>
    </article>
  );
}

type ColumnProps = {
  id: string;
  title: string;
  children: React.ReactNode;
};

function DroppableColumn({ id, title, children }: ColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      className={`rounded-2xl border bg-white p-3 ${
        isOver ? "border-cyan-300" : "border-slate-200"
      }`}
    >
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </section>
  );
}

export function ReservationsBoardDnd({ lang, initialItems, onItemsChange }: Props) {
  const [items, setItems] = useState<ReservationBoardItem[]>(initialItems);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const text = labels(lang);
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columns = useMemo(() => {
    return statuses.map((status) => ({
      status,
      items: items
        .filter((item) => item.reservation_status === status)
        .sort((a, b) => a.sort_order - b.sort_order),
    }));
  }, [items]);

  function findContainerById(id: string) {
    if (id.startsWith("container:")) {
      return id.replace("container:", "") as ReservationStatus;
    }
    const item = items.find((entry) => String(entry.id) === id);
    return item?.reservation_status;
  }

  async function persist(nextItems: ReservationBoardItem[]) {
    setSaving(true);
    setMessage(text.saving);
    try {
      const response = await fetch("/api/reservations/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: nextItems.map((item) => ({
            id: Number(item.id),
            reservation_status: item.reservation_status,
            sort_order: Number(item.sort_order),
          })),
        }),
      });
      const data = (await response.json()) as { ok?: boolean; message?: string };
      setMessage(response.ok && data.ok ? text.saved : data.message ?? text.failed);
    } catch {
      setMessage(text.failed);
    } finally {
      setSaving(false);
    }
  }

  function renumber(nextItems: ReservationBoardItem[]) {
    return statuses.flatMap((status) => {
      const inStatus = nextItems.filter((item) => item.reservation_status === status);
      return inStatus.map((item, index) => ({ ...item, sort_order: index }));
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    if (String(active.id) === String(over.id)) return;

    const activeContainer = findContainerById(String(active.id));
    const overContainer = findContainerById(String(over.id));
    if (!activeContainer || !overContainer) return;

    const activeIndex = items.findIndex((entry) => String(entry.id) === String(active.id));
    if (activeIndex < 0) return;

    const overIsContainer = String(over.id).startsWith("container:");
    const overIndex = overIsContainer
      ? items.reduce((lastIndex, item, index) => (item.reservation_status === overContainer ? index : lastIndex), -1)
      : items.findIndex((entry) => String(entry.id) === String(over.id));
    if (overIndex < -1) return;

    let nextItems = items.slice();
    if (activeContainer === overContainer) {
      if (!overIsContainer) {
        nextItems = arrayMove(nextItems, activeIndex, overIndex);
      }
    } else {
      const moved = { ...nextItems[activeIndex], reservation_status: overContainer };
      nextItems.splice(activeIndex, 1);
      if (overIndex === -1) {
        nextItems.push(moved);
      } else {
        nextItems.splice(overIndex, 0, moved);
      }
    }

    const normalized = renumber(nextItems);
    setItems(normalized);
    onItemsChange?.(normalized);
    void persist(normalized);
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  const activeItem = activeId ? items.find((item) => String(item.id) === activeId) : null;

  return (
    <div className="space-y-3">
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid gap-3 lg:grid-cols-4">
          {columns.map((column) => (
            <DroppableColumn
              key={column.status}
              id={`container:${column.status}`}
              title={text[column.status]}
            >
              <SortableContext
                items={column.items.map((item) => String(item.id))}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {column.items.map((item) => (
                    <SortCard key={item.id} item={item} />
                  ))}
                </div>
              </SortableContext>
            </DroppableColumn>
          ))}
        </div>
        <DragOverlay>
          {activeItem ? <SortCard item={activeItem} dragOverlay /> : null}
        </DragOverlay>
      </DndContext>
      <p className={`text-xs ${saving ? "text-amber-700" : "text-blue-600"}`}>{message}</p>
    </div>
  );
}
