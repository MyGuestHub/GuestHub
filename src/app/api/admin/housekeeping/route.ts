import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import {
  listHousekeepingTasks,
  createHousekeepingTask,
  updateHousekeepingTaskStatus,
  deleteHousekeepingTask,
} from "@/lib/data";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "housekeeping.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const tasks = await listHousekeepingTasks();
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "housekeeping.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { roomId, taskType, priority, assignedTo, notes } = body;

  if (!roomId || !taskType) {
    return NextResponse.json({ error: "roomId and taskType are required" }, { status: 400 });
  }

  const validTypes = ["cleaning", "turndown", "inspection", "deep_clean"];
  const validPriorities = ["low", "normal", "high", "urgent"];

  if (!validTypes.includes(taskType)) {
    return NextResponse.json({ error: "Invalid taskType" }, { status: 400 });
  }
  if (priority && !validPriorities.includes(priority)) {
    return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
  }

  const id = await createHousekeepingTask(
    Number(roomId),
    taskType,
    priority || "normal",
    assignedTo ? Number(assignedTo) : null,
    notes || null,
  );

  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "housekeeping.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { taskId, status } = body;

  if (!taskId || !status) {
    return NextResponse.json({ error: "taskId and status are required" }, { status: 400 });
  }

  const validStatuses = ["pending", "in_progress", "done", "verified"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await updateHousekeepingTaskStatus(Number(taskId), status);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "housekeeping.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("id");
  if (!taskId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await deleteHousekeepingTask(Number(taskId));
  return NextResponse.json({ ok: true });
}
