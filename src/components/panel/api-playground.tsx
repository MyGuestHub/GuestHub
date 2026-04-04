"use client";

import { useState, useCallback } from "react";
import {
  FiPlay,
  FiCopy,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiCheck,
  FiAlertCircle,
  FiZap,
  FiLock,
  FiServer,
} from "react-icons/fi";

type Param = {
  name: string;
  type: "string" | "number";
  description: string;
  descriptionAr: string;
  required?: boolean;
  example?: string;
  options?: string[];
  in?: "query" | "path" | "body";
};

type Endpoint = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  summary: string;
  summaryAr: string;
  scope: string;
  params: Param[];
  tag: string;
};

const ENDPOINTS: Endpoint[] = [
  /* ── Rooms ─────────────────────────────────── */
  {
    method: "GET", path: "/api/v1/rooms", summary: "List all rooms", summaryAr: "عرض جميع الغرف", scope: "rooms.read", tag: "Rooms",
    params: [
      { name: "status", type: "string", description: "Filter by status", descriptionAr: "تصفية حسب الحالة", options: ["active", "maintenance", "inactive"] },
      { name: "floor", type: "number", description: "Filter by floor", descriptionAr: "تصفية حسب الطابق", example: "2" },
    ],
  },
  {
    method: "GET", path: "/api/v1/rooms/{id}", summary: "Get room by ID", summaryAr: "عرض غرفة بالمعرّف", scope: "rooms.read", tag: "Rooms",
    params: [{ name: "id", type: "number", description: "Room ID", descriptionAr: "معرّف الغرفة", required: true, example: "1", in: "path" }],
  },
  {
    method: "POST", path: "/api/v1/rooms", summary: "Create a room", summaryAr: "إنشاء غرفة", scope: "rooms.write", tag: "Rooms",
    params: [
      { name: "room_number", type: "string", description: "Room number", descriptionAr: "رقم الغرفة", required: true, example: "301", in: "body" },
      { name: "floor", type: "number", description: "Floor", descriptionAr: "الطابق", example: "3", in: "body" },
      { name: "room_type", type: "string", description: "Type", descriptionAr: "النوع", example: "deluxe", in: "body" },
      { name: "capacity", type: "number", description: "Capacity", descriptionAr: "السعة", example: "2", in: "body" },
      { name: "status", type: "string", description: "Status", descriptionAr: "الحالة", options: ["active", "maintenance"], in: "body" },
    ],
  },
  {
    method: "PUT", path: "/api/v1/rooms/{id}", summary: "Update a room", summaryAr: "تحديث غرفة", scope: "rooms.write", tag: "Rooms",
    params: [
      { name: "id", type: "number", description: "Room ID", descriptionAr: "معرّف الغرفة", required: true, example: "1", in: "path" },
      { name: "room_number", type: "string", description: "Room number", descriptionAr: "رقم الغرفة", example: "301", in: "body" },
      { name: "floor", type: "number", description: "Floor", descriptionAr: "الطابق", example: "3", in: "body" },
      { name: "room_type", type: "string", description: "Type", descriptionAr: "النوع", example: "suite", in: "body" },
      { name: "capacity", type: "number", description: "Capacity", descriptionAr: "السعة", example: "4", in: "body" },
      { name: "status", type: "string", description: "Status", descriptionAr: "الحالة", options: ["active", "maintenance", "inactive"], in: "body" },
    ],
  },
  {
    method: "DELETE", path: "/api/v1/rooms/{id}", summary: "Delete a room", summaryAr: "حذف غرفة", scope: "rooms.write", tag: "Rooms",
    params: [{ name: "id", type: "number", description: "Room ID", descriptionAr: "معرّف الغرفة", required: true, example: "1", in: "path" }],
  },

  /* ── Guests ────────────────────────────────── */
  {
    method: "GET", path: "/api/v1/guests", summary: "List guests", summaryAr: "عرض الضيوف", scope: "guests.read", tag: "Guests",
    params: [
      { name: "search", type: "string", description: "Search name/email/phone", descriptionAr: "بحث بالاسم أو البريد أو الهاتف", example: "Ahmed" },
      { name: "limit", type: "number", description: "Max results (1-100)", descriptionAr: "الحد الأقصى", example: "20" },
      { name: "offset", type: "number", description: "Skip N results", descriptionAr: "تخطي N نتيجة", example: "0" },
    ],
  },
  {
    method: "GET", path: "/api/v1/guests/{id}", summary: "Get guest by ID", summaryAr: "عرض ضيف بالمعرّف", scope: "guests.read", tag: "Guests",
    params: [{ name: "id", type: "number", description: "Guest ID", descriptionAr: "معرّف الضيف", required: true, example: "1", in: "path" }],
  },
  {
    method: "POST", path: "/api/v1/guests", summary: "Create a guest", summaryAr: "إنشاء ضيف", scope: "guests.write", tag: "Guests",
    params: [
      { name: "first_name", type: "string", description: "First name", descriptionAr: "الاسم الأول", required: true, example: "Ahmed", in: "body" },
      { name: "last_name", type: "string", description: "Last name", descriptionAr: "اسم العائلة", required: true, example: "Al-Rashid", in: "body" },
      { name: "email", type: "string", description: "Email", descriptionAr: "البريد", example: "ahmed@example.com", in: "body" },
      { name: "phone", type: "string", description: "Phone", descriptionAr: "الهاتف", example: "+968 9000 0000", in: "body" },
      { name: "notes", type: "string", description: "Notes", descriptionAr: "ملاحظات", in: "body" },
    ],
  },
  {
    method: "PUT", path: "/api/v1/guests/{id}", summary: "Update a guest", summaryAr: "تحديث ضيف", scope: "guests.write", tag: "Guests",
    params: [
      { name: "id", type: "number", description: "Guest ID", descriptionAr: "معرّف الضيف", required: true, example: "1", in: "path" },
      { name: "first_name", type: "string", description: "First name", descriptionAr: "الاسم الأول", example: "Ahmed", in: "body" },
      { name: "last_name", type: "string", description: "Last name", descriptionAr: "اسم العائلة", example: "Al-Rashid", in: "body" },
      { name: "email", type: "string", description: "Email", descriptionAr: "البريد", in: "body" },
      { name: "phone", type: "string", description: "Phone", descriptionAr: "الهاتف", in: "body" },
      { name: "notes", type: "string", description: "Notes", descriptionAr: "ملاحظات", in: "body" },
    ],
  },
  {
    method: "DELETE", path: "/api/v1/guests/{id}", summary: "Delete a guest", summaryAr: "حذف ضيف", scope: "guests.write", tag: "Guests",
    params: [{ name: "id", type: "number", description: "Guest ID", descriptionAr: "معرّف الضيف", required: true, example: "1", in: "path" }],
  },

  /* ── Reservations ──────────────────────────── */
  {
    method: "GET", path: "/api/v1/reservations", summary: "List reservations", summaryAr: "عرض الحجوزات", scope: "reservations.read", tag: "Reservations",
    params: [
      { name: "status", type: "string", description: "Filter by status", descriptionAr: "تصفية حسب الحالة", options: ["booked", "checked_in", "checked_out", "cancelled"] },
      { name: "room_id", type: "number", description: "Filter by room", descriptionAr: "تصفية حسب الغرفة", example: "1" },
      { name: "guest_id", type: "number", description: "Filter by guest", descriptionAr: "تصفية حسب الضيف", example: "1" },
      { name: "limit", type: "number", description: "Max results", descriptionAr: "الحد الأقصى", example: "50" },
      { name: "offset", type: "number", description: "Skip N results", descriptionAr: "تخطي", example: "0" },
    ],
  },
  {
    method: "GET", path: "/api/v1/reservations/{id}", summary: "Get reservation by ID", summaryAr: "عرض حجز بالمعرّف", scope: "reservations.read", tag: "Reservations",
    params: [{ name: "id", type: "number", description: "Reservation ID", descriptionAr: "معرّف الحجز", required: true, example: "1", in: "path" }],
  },
  {
    method: "POST", path: "/api/v1/reservations", summary: "Create a reservation", summaryAr: "إنشاء حجز", scope: "reservations.write", tag: "Reservations",
    params: [
      { name: "guest_id", type: "number", description: "Guest ID", descriptionAr: "معرّف الضيف", required: true, example: "1", in: "body" },
      { name: "room_id", type: "number", description: "Room ID", descriptionAr: "معرّف الغرفة", required: true, example: "1", in: "body" },
      { name: "check_in", type: "string", description: "Check-in (ISO 8601)", descriptionAr: "تسجيل الوصول", required: true, example: "2026-01-15T14:00:00Z", in: "body" },
      { name: "check_out", type: "string", description: "Check-out (ISO 8601)", descriptionAr: "تسجيل المغادرة", required: true, example: "2026-01-18T12:00:00Z", in: "body" },
      { name: "status", type: "string", description: "Initial status", descriptionAr: "الحالة الأولية", options: ["booked", "checked_in"], in: "body" },
      { name: "adults", type: "number", description: "Adults count", descriptionAr: "عدد البالغين", example: "2", in: "body" },
      { name: "children", type: "number", description: "Children count", descriptionAr: "عدد الأطفال", example: "0", in: "body" },
      { name: "notes", type: "string", description: "Notes", descriptionAr: "ملاحظات", in: "body" },
    ],
  },
  {
    method: "PUT", path: "/api/v1/reservations/{id}", summary: "Update a reservation", summaryAr: "تحديث حجز", scope: "reservations.write", tag: "Reservations",
    params: [
      { name: "id", type: "number", description: "Reservation ID", descriptionAr: "معرّف الحجز", required: true, example: "1", in: "path" },
      { name: "reservation_status", type: "string", description: "Status", descriptionAr: "الحالة", options: ["booked", "checked_in", "checked_out", "cancelled"], in: "body" },
      { name: "check_in", type: "string", description: "Check-in", descriptionAr: "تسجيل الوصول", example: "2026-01-15T14:00:00Z", in: "body" },
      { name: "check_out", type: "string", description: "Check-out", descriptionAr: "تسجيل المغادرة", example: "2026-01-18T12:00:00Z", in: "body" },
      { name: "adults", type: "number", description: "Adults", descriptionAr: "البالغين", example: "2", in: "body" },
      { name: "children", type: "number", description: "Children", descriptionAr: "الأطفال", example: "0", in: "body" },
      { name: "dnd_active", type: "string", description: "DND (true/false)", descriptionAr: "عدم الإزعاج", options: ["true", "false"], in: "body" },
      { name: "notes", type: "string", description: "Notes", descriptionAr: "ملاحظات", in: "body" },
    ],
  },
  {
    method: "DELETE", path: "/api/v1/reservations/{id}", summary: "Cancel a reservation", summaryAr: "إلغاء حجز", scope: "reservations.write", tag: "Reservations",
    params: [{ name: "id", type: "number", description: "Reservation ID", descriptionAr: "معرّف الحجز", required: true, example: "1", in: "path" }],
  },

  /* ── Services (read-only) ──────────────────── */
  {
    method: "GET", path: "/api/v1/services", summary: "List service categories & items", summaryAr: "عرض فئات الخدمات", scope: "services.read", tag: "Services",
    params: [],
  },

  /* ── Service Requests ──────────────────────── */
  {
    method: "GET", path: "/api/v1/service-requests", summary: "List service requests", summaryAr: "عرض طلبات الخدمة", scope: "requests.read", tag: "Service Requests",
    params: [
      { name: "status", type: "string", description: "Filter by status", descriptionAr: "تصفية حسب الحالة", options: ["pending", "accepted", "in_progress", "completed", "cancelled"] },
      { name: "room_id", type: "number", description: "Filter by room", descriptionAr: "تصفية حسب الغرفة", example: "1" },
      { name: "limit", type: "number", description: "Max results", descriptionAr: "الحد الأقصى", example: "50" },
      { name: "offset", type: "number", description: "Skip N", descriptionAr: "تخطي", example: "0" },
    ],
  },
  {
    method: "GET", path: "/api/v1/service-requests/{id}", summary: "Get service request by ID", summaryAr: "عرض طلب خدمة", scope: "requests.read", tag: "Service Requests",
    params: [{ name: "id", type: "number", description: "Request ID", descriptionAr: "معرّف الطلب", required: true, example: "1", in: "path" }],
  },
  {
    method: "POST", path: "/api/v1/service-requests", summary: "Create a service request", summaryAr: "إنشاء طلب خدمة", scope: "requests.write", tag: "Service Requests",
    params: [
      { name: "reservation_id", type: "number", description: "Reservation ID", descriptionAr: "معرّف الحجز", required: true, example: "1", in: "body" },
      { name: "room_id", type: "number", description: "Room ID", descriptionAr: "معرّف الغرفة", required: true, example: "1", in: "body" },
      { name: "guest_id", type: "number", description: "Guest ID", descriptionAr: "معرّف الضيف", required: true, example: "1", in: "body" },
      { name: "service_item_id", type: "number", description: "Service item ID", descriptionAr: "معرّف العنصر", required: true, example: "1", in: "body" },
      { name: "quantity", type: "number", description: "Quantity", descriptionAr: "الكمية", example: "1", in: "body" },
      { name: "notes", type: "string", description: "Notes", descriptionAr: "ملاحظات", in: "body" },
      { name: "scheduled_at", type: "string", description: "Schedule time (ISO 8601)", descriptionAr: "وقت مجدول", example: "2026-01-15T08:00:00Z", in: "body" },
    ],
  },
  {
    method: "PUT", path: "/api/v1/service-requests/{id}", summary: "Update a service request", summaryAr: "تحديث طلب خدمة", scope: "requests.write", tag: "Service Requests",
    params: [
      { name: "id", type: "number", description: "Request ID", descriptionAr: "معرّف الطلب", required: true, example: "1", in: "path" },
      { name: "request_status", type: "string", description: "Status", descriptionAr: "الحالة", options: ["pending", "accepted", "in_progress", "completed", "cancelled"], in: "body" },
      { name: "assigned_to", type: "number", description: "Assign to user ID", descriptionAr: "تعيين لمستخدم", example: "1", in: "body" },
      { name: "notes", type: "string", description: "Notes", descriptionAr: "ملاحظات", in: "body" },
      { name: "quantity", type: "number", description: "Quantity", descriptionAr: "الكمية", example: "1", in: "body" },
      { name: "cancellation_reason", type: "string", description: "Cancellation reason", descriptionAr: "سبب الإلغاء", in: "body" },
    ],
  },

  /* ── Housekeeping ──────────────────────────── */
  {
    method: "GET", path: "/api/v1/housekeeping", summary: "List housekeeping tasks", summaryAr: "عرض مهام التنظيف", scope: "housekeeping.read", tag: "Housekeeping",
    params: [
      { name: "status", type: "string", description: "Filter by status", descriptionAr: "تصفية حسب الحالة", options: ["pending", "in_progress", "done", "verified"] },
      { name: "priority", type: "string", description: "Filter by priority", descriptionAr: "تصفية حسب الأولوية", options: ["low", "normal", "high", "urgent"] },
      { name: "limit", type: "number", description: "Max results", descriptionAr: "الحد الأقصى", example: "50" },
      { name: "offset", type: "number", description: "Skip N", descriptionAr: "تخطي", example: "0" },
    ],
  },
  {
    method: "GET", path: "/api/v1/housekeeping/{id}", summary: "Get task by ID", summaryAr: "عرض مهمة بالمعرّف", scope: "housekeeping.read", tag: "Housekeeping",
    params: [{ name: "id", type: "number", description: "Task ID", descriptionAr: "معرّف المهمة", required: true, example: "1", in: "path" }],
  },
  {
    method: "POST", path: "/api/v1/housekeeping", summary: "Create a housekeeping task", summaryAr: "إنشاء مهمة تنظيف", scope: "housekeeping.write", tag: "Housekeeping",
    params: [
      { name: "room_id", type: "number", description: "Room ID", descriptionAr: "معرّف الغرفة", required: true, example: "1", in: "body" },
      { name: "task_type", type: "string", description: "Task type", descriptionAr: "نوع المهمة", options: ["cleaning", "turndown", "inspection", "deep_clean"], in: "body" },
      { name: "priority", type: "string", description: "Priority", descriptionAr: "الأولوية", options: ["low", "normal", "high", "urgent"], in: "body" },
      { name: "assigned_to", type: "number", description: "Assign to user ID", descriptionAr: "تعيين لمستخدم", example: "1", in: "body" },
      { name: "notes", type: "string", description: "Notes", descriptionAr: "ملاحظات", in: "body" },
    ],
  },
  {
    method: "PUT", path: "/api/v1/housekeeping/{id}", summary: "Update a housekeeping task", summaryAr: "تحديث مهمة تنظيف", scope: "housekeeping.write", tag: "Housekeeping",
    params: [
      { name: "id", type: "number", description: "Task ID", descriptionAr: "معرّف المهمة", required: true, example: "1", in: "path" },
      { name: "task_status", type: "string", description: "Status", descriptionAr: "الحالة", options: ["pending", "in_progress", "done", "verified"], in: "body" },
      { name: "priority", type: "string", description: "Priority", descriptionAr: "الأولوية", options: ["low", "normal", "high", "urgent"], in: "body" },
      { name: "assigned_to", type: "number", description: "Assign to user ID", descriptionAr: "تعيين لمستخدم", example: "1", in: "body" },
      { name: "notes", type: "string", description: "Notes", descriptionAr: "ملاحظات", in: "body" },
    ],
  },
  {
    method: "DELETE", path: "/api/v1/housekeeping/{id}", summary: "Delete a housekeeping task", summaryAr: "حذف مهمة تنظيف", scope: "housekeeping.write", tag: "Housekeeping",
    params: [{ name: "id", type: "number", description: "Task ID", descriptionAr: "معرّف المهمة", required: true, example: "1", in: "path" }],
  },

  /* ── Facilities ────────────────────────────── */
  {
    method: "GET", path: "/api/v1/facilities", summary: "List facilities & bookings", summaryAr: "عرض المرافق والحجوزات", scope: "facilities.read", tag: "Facilities",
    params: [{ name: "date", type: "string", description: "Filter by date (YYYY-MM-DD)", descriptionAr: "تصفية حسب التاريخ", example: "2026-04-05" }],
  },
  {
    method: "POST", path: "/api/v1/facilities", summary: "Book a facility slot", summaryAr: "حجز مرفق", scope: "facilities.write", tag: "Facilities",
    params: [
      { name: "facility_id", type: "number", description: "Facility type ID", descriptionAr: "معرّف المرفق", required: true, example: "1", in: "body" },
      { name: "reservation_id", type: "number", description: "Reservation ID", descriptionAr: "معرّف الحجز", required: true, example: "1", in: "body" },
      { name: "guest_id", type: "number", description: "Guest ID", descriptionAr: "معرّف الضيف", required: true, example: "1", in: "body" },
      { name: "booking_date", type: "string", description: "Date (YYYY-MM-DD)", descriptionAr: "التاريخ", required: true, example: "2026-04-05", in: "body" },
      { name: "start_time", type: "string", description: "Start time (HH:MM)", descriptionAr: "وقت البداية", required: true, example: "10:00", in: "body" },
      { name: "end_time", type: "string", description: "End time (HH:MM)", descriptionAr: "وقت النهاية", required: true, example: "11:00", in: "body" },
      { name: "guests_count", type: "number", description: "Number of guests", descriptionAr: "عدد الضيوف", example: "2", in: "body" },
      { name: "notes", type: "string", description: "Notes", descriptionAr: "ملاحظات", in: "body" },
    ],
  },

  /* ── Invoices ──────────────────────────────── */
  {
    method: "GET", path: "/api/v1/invoices", summary: "List invoices", summaryAr: "عرض الفواتير", scope: "invoices.read", tag: "Invoices",
    params: [
      { name: "reservation_id", type: "number", description: "Filter by reservation", descriptionAr: "تصفية حسب الحجز", example: "1" },
      { name: "status", type: "string", description: "Filter by status", descriptionAr: "تصفية حسب الحالة", options: ["open", "closed", "paid"] },
      { name: "limit", type: "number", description: "Max results", descriptionAr: "الحد الأقصى", example: "50" },
      { name: "offset", type: "number", description: "Skip N", descriptionAr: "تخطي", example: "0" },
    ],
  },
  {
    method: "GET", path: "/api/v1/invoices/{id}", summary: "Get invoice by ID", summaryAr: "عرض فاتورة بالمعرّف", scope: "invoices.read", tag: "Invoices",
    params: [{ name: "id", type: "number", description: "Invoice ID", descriptionAr: "معرّف الفاتورة", required: true, example: "1", in: "path" }],
  },
  {
    method: "POST", path: "/api/v1/invoices", summary: "Create an invoice", summaryAr: "إنشاء فاتورة", scope: "invoices.write", tag: "Invoices",
    params: [
      { name: "reservation_id", type: "number", description: "Reservation ID", descriptionAr: "معرّف الحجز", required: true, example: "1", in: "body" },
      { name: "subtotal", type: "number", description: "Subtotal amount", descriptionAr: "المجموع الفرعي", example: "150.00", in: "body" },
      { name: "tax_rate", type: "number", description: "Tax rate (decimal)", descriptionAr: "معدل الضريبة", example: "0.05", in: "body" },
      { name: "currency", type: "string", description: "Currency code", descriptionAr: "العملة", example: "OMR", in: "body" },
      { name: "notes", type: "string", description: "Notes", descriptionAr: "ملاحظات", in: "body" },
    ],
  },
  {
    method: "PUT", path: "/api/v1/invoices/{id}", summary: "Update an invoice", summaryAr: "تحديث فاتورة", scope: "invoices.write", tag: "Invoices",
    params: [
      { name: "id", type: "number", description: "Invoice ID", descriptionAr: "معرّف الفاتورة", required: true, example: "1", in: "path" },
      { name: "status", type: "string", description: "Status", descriptionAr: "الحالة", options: ["open", "closed", "paid"], in: "body" },
      { name: "subtotal", type: "number", description: "Subtotal", descriptionAr: "المجموع الفرعي", example: "200.00", in: "body" },
      { name: "tax_rate", type: "number", description: "Tax rate", descriptionAr: "معدل الضريبة", example: "0.05", in: "body" },
      { name: "notes", type: "string", description: "Notes", descriptionAr: "ملاحظات", in: "body" },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/25 text-emerald-300 border-emerald-500/30",
  POST: "bg-blue-500/25 text-blue-300 border-blue-500/30",
  PUT: "bg-amber-500/25 text-amber-300 border-amber-500/30",
  DELETE: "bg-rose-500/25 text-rose-300 border-rose-500/30",
};

const TAG_COLORS: Record<string, string> = {
  Rooms: "from-emerald-500/15 to-teal-500/15 border-emerald-500/20",
  Guests: "from-blue-500/15 to-cyan-500/15 border-blue-500/20",
  Reservations: "from-violet-500/15 to-purple-500/15 border-violet-500/20",
  Services: "from-amber-500/15 to-orange-500/15 border-amber-500/20",
  "Service Requests": "from-rose-500/15 to-pink-500/15 border-rose-500/20",
  Housekeeping: "from-cyan-500/15 to-sky-500/15 border-cyan-500/20",
  Facilities: "from-green-500/15 to-lime-500/15 border-green-500/20",
  Invoices: "from-indigo-500/15 to-blue-500/15 border-indigo-500/20",
};

type Props = {
  lang: "ar" | "en";
};

export function ApiPlayground({ lang }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [activeEndpoint, setActiveEndpoint] = useState<number | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    body: string;
    time: number;
    headers: Record<string, string>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const t = (ar: string, en: string) => (lang === "ar" ? ar : en);

  const tags = Array.from(new Set(ENDPOINTS.map((e) => e.tag)));
  const filteredEndpoints = filterTag ? ENDPOINTS.filter((e) => e.tag === filterTag) : ENDPOINTS;

  const copyText = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const buildUrl = useCallback(
    (ep: Endpoint) => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      let path = ep.path;

      // Replace path params like {id}
      const pathParams = ep.params.filter((p) => p.in === "path" || path.includes(`{${p.name}}`));
      for (const p of pathParams) {
        path = path.replace(`{${p.name}}`, paramValues[p.name] || p.example || "1");
      }

      // Build query string (only non-body, non-path params)
      const queryParams = ep.params.filter((p) => p.in !== "body" && p.in !== "path" && !ep.path.includes(`{${p.name}}`));
      const qs = queryParams
        .map((p) => {
          const val = paramValues[p.name];
          return val ? `${p.name}=${encodeURIComponent(val)}` : null;
        })
        .filter(Boolean)
        .join("&");

      return `${origin}${path}${qs ? `?${qs}` : ""}`;
    },
    [paramValues],
  );

  const buildBody = useCallback(
    (ep: Endpoint): Record<string, unknown> | null => {
      const bodyParams = ep.params.filter((p) => p.in === "body");
      if (!bodyParams.length) return null;
      const obj: Record<string, unknown> = {};
      for (const p of bodyParams) {
        const val = paramValues[p.name];
        if (val !== undefined && val !== "") {
          obj[p.name] = p.type === "number" ? Number(val) : val;
        }
      }
      return Object.keys(obj).length ? obj : null;
    },
    [paramValues],
  );

  const buildCurl = useCallback(
    (ep: Endpoint) => {
      const url = buildUrl(ep);
      const key = apiKey || "ghk_your_key_here";
      const body = buildBody(ep);
      const method = ep.method !== "GET" ? ` -X ${ep.method}` : "";
      const contentType = body ? ` \\\n  -H "Content-Type: application/json"` : "";
      const dataFlag = body ? ` \\\n  -d '${JSON.stringify(body)}'` : "";
      return `curl -s${method} \\\n  -H "X-Api-Key: ${key}"${contentType}${dataFlag} \\\n  "${url}" | jq .`;
    },
    [apiKey, buildUrl, buildBody],
  );

  const executeRequest = useCallback(
    async (ep: Endpoint) => {
      if (!apiKey) return;
      setLoading(true);
      setResponse(null);

      const url = buildUrl(ep);
      const reqBody = buildBody(ep);
      const start = performance.now();

      try {
        const reqHeaders: Record<string, string> = { "X-Api-Key": apiKey };
        if (reqBody) reqHeaders["Content-Type"] = "application/json";

        const res = await fetch(url, {
          method: ep.method,
          headers: reqHeaders,
          body: reqBody ? JSON.stringify(reqBody) : undefined,
        });
        const elapsed = Math.round(performance.now() - start);
        const text = await res.text();

        let resBody: string;
        try {
          resBody = JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          resBody = text;
        }

        const resHeaders: Record<string, string> = {};
        res.headers.forEach((v, k) => { resHeaders[k] = v; });

        setResponse({
          status: res.status,
          statusText: res.statusText,
          body: resBody,
          time: elapsed,
          headers: resHeaders,
        });
      } catch (err) {
        setResponse({
          status: 0,
          statusText: "Network Error",
          body: String(err),
          time: Math.round(performance.now() - start),
          headers: {},
        });
      } finally {
        setLoading(false);
      }
    },
    [apiKey, buildUrl, buildBody],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-2.5">
          <FiZap className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{t("ملعب API", "API Playground")}</h2>
          <p className="text-xs text-white/50">{t("اختبر نقاط الوصول مباشرة", "Test endpoints live in your browser")}</p>
        </div>
      </div>

      {/* API Key input */}
      <div className="rounded-2xl border border-white/15 bg-slate-900/50 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-500/20 p-2">
            <FiLock className="h-4 w-4 text-amber-300" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-white/60">
              {t("مفتاح API للاختبار", "API Key for testing")}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="ghk_..."
              className="w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 font-mono text-sm text-white placeholder-white/30 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
            />
          </div>
        </div>
        {!apiKey && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-300/70">
            <FiAlertCircle className="h-3.5 w-3.5" />
            {t("أدخل مفتاح API للتمكن من تنفيذ الطلبات", "Enter an API key to execute requests")}
          </p>
        )}
      </div>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterTag(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            !filterTag
              ? "bg-white/15 text-white shadow-sm"
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          }`}
        >
          {t("الكل", "All")} ({ENDPOINTS.length})
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setFilterTag(filterTag === tag ? null : tag)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filterTag === tag
                ? "bg-white/15 text-white shadow-sm"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            {tag} ({ENDPOINTS.filter((e) => e.tag === tag).length})
          </button>
        ))}
      </div>

      {/* Endpoints */}
      <div className="space-y-3">
        {filteredEndpoints.map((ep, idx) => {
          const globalIdx = ENDPOINTS.indexOf(ep);
          const isActive = activeEndpoint === globalIdx;
          const tagColor = TAG_COLORS[ep.tag] || "from-slate-500/15 to-slate-500/15 border-slate-500/20";

          return (
            <div
              key={`${ep.method}-${ep.path}`}
              className={`overflow-hidden rounded-2xl border transition-all ${
                isActive ? `bg-gradient-to-br ${tagColor}` : "border-white/10 bg-slate-900/30 hover:border-white/20"
              }`}
            >
              {/* Endpoint row */}
              <button
                type="button"
                onClick={() => {
                  setActiveEndpoint(isActive ? null : globalIdx);
                  setResponse(null);
                  setParamValues({});
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-start"
              >
                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${METHOD_COLORS[ep.method]}`}>
                  {ep.method}
                </span>
                <code className="flex-1 text-sm text-white/90">{ep.path}</code>
                <span className="hidden text-xs text-white/40 sm:block">
                  {lang === "ar" ? ep.summaryAr : ep.summary}
                </span>
                <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-[10px] text-cyan-300">{ep.scope}</span>
                {isActive ? (
                  <FiChevronDown className="h-4 w-4 text-white/40" />
                ) : (
                  <FiChevronRight className="h-4 w-4 text-white/40" />
                )}
              </button>

              {/* Expanded panel */}
              {isActive && (
                <div className="border-t border-white/10 px-4 pb-4 pt-3">
                  {/* Parameters */}
                  {ep.params.length > 0 && (() => {
                    const pathP = ep.params.filter((p) => p.in === "path");
                    const queryP = ep.params.filter((p) => p.in !== "body" && p.in !== "path" && !ep.path.includes(`{${p.name}}`));
                    const bodyP = ep.params.filter((p) => p.in === "body");

                    const renderParams = (list: Param[], label: string) =>
                      list.length > 0 && (
                        <div className="mb-4">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">{label}</h4>
                          <div className="space-y-2">
                            {list.map((p) => (
                              <div key={p.name} className="flex items-center gap-3">
                                <div className="w-28 shrink-0">
                                  <span className="font-mono text-xs font-semibold text-white">{p.name}</span>
                                  {p.required && <span className="ms-1 text-[10px] text-rose-400">*</span>}
                                  <p className="text-[10px] text-white/40">{p.type}</p>
                                </div>
                                {p.options ? (
                                  <select
                                    value={paramValues[p.name] || ""}
                                    onChange={(e) => setParamValues({ ...paramValues, [p.name]: e.target.value })}
                                    className="flex-1 rounded-lg border border-white/15 bg-slate-900/60 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400/50"
                                  >
                                    <option value="">{t("— اختر —", "— select —")}</option>
                                    {p.options.map((opt) => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={paramValues[p.name] || ""}
                                    onChange={(e) => setParamValues({ ...paramValues, [p.name]: e.target.value })}
                                    placeholder={p.example || ""}
                                    className="flex-1 rounded-lg border border-white/15 bg-slate-900/60 px-3 py-1.5 font-mono text-xs text-white placeholder-white/25 outline-none focus:border-cyan-400/50"
                                  />
                                )}
                                <span className="hidden w-40 text-[10px] text-white/40 lg:block">
                                  {lang === "ar" ? p.descriptionAr : p.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );

                    return (
                      <>
                        {renderParams(pathP, t("المعاملات المسار", "Path Parameters"))}
                        {renderParams(queryP, t("معاملات الاستعلام", "Query Parameters"))}
                        {renderParams(bodyP, t("متن الطلب (JSON)", "Request Body (JSON)"))}
                      </>
                    );
                  })()}

                  {/* curl preview */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">cURL</h4>
                      <button
                        type="button"
                        onClick={() => copyText(buildCurl(ep), `curl-${globalIdx}`)}
                        className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] text-white/50 transition hover:bg-white/10 hover:text-white"
                      >
                        {copied === `curl-${globalIdx}` ? <FiCheck className="h-3 w-3 text-emerald-400" /> : <FiCopy className="h-3 w-3" />}
                        {copied === `curl-${globalIdx}` ? t("تم!", "Copied!") : t("نسخ", "Copy")}
                      </button>
                    </div>
                    <pre className="mt-1.5 overflow-x-auto rounded-xl bg-slate-950/80 p-3 text-xs text-emerald-300/80">
                      {buildCurl(ep)}
                    </pre>
                  </div>

                  {/* Execute button */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => executeRequest(ep)}
                      disabled={!apiKey || loading}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40 disabled:opacity-40 disabled:shadow-none"
                    >
                      {loading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <FiPlay className="h-4 w-4" />
                      )}
                      {loading ? t("جاري التنفيذ...", "Executing...") : t("تنفيذ", "Send Request")}
                    </button>

                    {/* URL preview */}
                    <code className="flex-1 truncate rounded-lg bg-slate-950/50 px-3 py-1.5 text-[11px] text-white/40">
                      {ep.method} {buildUrl(ep)}
                    </code>
                  </div>

                  {/* Response */}
                  {response && (
                    <div className="mt-4">
                      {/* Response header */}
                      <div className="flex items-center gap-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                          {t("الاستجابة", "Response")}
                        </h4>
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                            response.status >= 200 && response.status < 300
                              ? "bg-emerald-500/25 text-emerald-300"
                              : response.status >= 400
                                ? "bg-rose-500/25 text-rose-300"
                                : "bg-amber-500/25 text-amber-300"
                          }`}
                        >
                          {response.status} {response.statusText}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-white/40">
                          <FiClock className="h-3 w-3" />
                          {response.time}ms
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(response.body, `resp-${globalIdx}`)}
                          className="ms-auto flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] text-white/50 transition hover:bg-white/10 hover:text-white"
                        >
                          {copied === `resp-${globalIdx}` ? <FiCheck className="h-3 w-3 text-emerald-400" /> : <FiCopy className="h-3 w-3" />}
                          {t("نسخ", "Copy")}
                        </button>
                      </div>

                      {/* Response body */}
                      <pre className="mt-2 max-h-96 overflow-auto rounded-xl bg-slate-950/80 p-4 text-xs leading-relaxed">
                        <code
                          className={
                            response.status >= 200 && response.status < 300
                              ? "text-emerald-300/90"
                              : "text-rose-300/90"
                          }
                        >
                          {response.body}
                        </code>
                      </pre>

                      {/* Response headers (collapsible) */}
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[10px] text-white/30 transition hover:text-white/50">
                          {t("هدرهای پاسخ", "Response Headers")} ({Object.keys(response.headers).length})
                        </summary>
                        <div className="mt-1 rounded-lg bg-slate-950/50 p-2">
                          {Object.entries(response.headers).map(([k, v]) => (
                            <div key={k} className="flex gap-2 py-0.5 text-[10px]">
                              <span className="font-mono text-cyan-300/60">{k}:</span>
                              <span className="text-white/40">{v}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rate limit & Auth info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <FiLock className="h-4 w-4 text-amber-300" />
            <h4 className="text-xs font-semibold text-white">{t("المصادقة", "Authentication")}</h4>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="rounded-lg bg-slate-950/50 px-3 py-1.5">
              <span className="text-white/40">Header: </span>
              <code className="text-cyan-300">X-Api-Key: ghk_...</code>
            </div>
            <div className="rounded-lg bg-slate-950/50 px-3 py-1.5">
              <span className="text-white/40">Bearer: </span>
              <code className="text-cyan-300">Authorization: Bearer ghk_...</code>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <FiServer className="h-4 w-4 text-emerald-300" />
            <h4 className="text-xs font-semibold text-white">{t("شکل پاسخ", "Response Format")}</h4>
          </div>
          <pre className="rounded-lg bg-slate-950/50 p-2 text-[10px] text-emerald-300/70">{`{
  "data": [...],
  "meta": {
    "timestamp": "ISO-8601"
  }
}`}</pre>
        </div>
      </div>

      {/* HTTP Status Codes */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-4">
        <h4 className="mb-3 text-xs font-semibold text-white">{t("کدهای وضعیت", "Status Codes")}</h4>
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { code: 200, label: "OK", desc: t("موفق", "Success"), color: "text-emerald-300" },
            { code: 201, label: "Created", desc: t("تم الإنشاء", "Resource created"), color: "text-emerald-300" },
            { code: 401, label: "Unauthorized", desc: t("مفتاح نامعتبر", "Invalid API key"), color: "text-rose-300" },
            { code: 403, label: "Forbidden", desc: t("صلاحية ناکافی", "Insufficient scope"), color: "text-amber-300" },
            { code: 404, label: "Not Found", desc: t("یافت نشد", "Resource not found"), color: "text-slate-300" },
            { code: 409, label: "Conflict", desc: t("تعارض", "Duplicate / conflict"), color: "text-orange-300" },
            { code: 422, label: "Validation", desc: t("خطای اعتبارسنجی", "Validation error"), color: "text-amber-300" },
            { code: 429, label: "Too Many Requests", desc: t("تجاوز حد نرخ", "Rate limit exceeded"), color: "text-orange-300" },
            { code: 500, label: "Server Error", desc: t("خطای سرور", "Internal error"), color: "text-rose-400" },
          ].map((s) => (
            <div key={s.code} className="flex items-center gap-2 rounded-lg bg-slate-950/40 px-3 py-1.5">
              <span className={`font-mono text-xs font-bold ${s.color}`}>{s.code}</span>
              <span className="text-[10px] text-white/60">{s.label}</span>
              <span className="ms-auto text-[10px] text-white/30">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
