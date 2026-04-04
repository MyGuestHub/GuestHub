#!/usr/bin/env node
/**
 * GuestHub WebSocket Chat Server
 * Standalone real-time chat server for guest ↔ staff messaging.
 * Runs on port 3001 alongside Next.js on port 3000.
 *
 * Protocol:
 *   Guest connects:  ws://host:3001?token=<guest_session_token>
 *   Staff connects:  ws://host:3001?session=<staff_session_token>
 *
 * Messages (client → server):
 *   { type: "chat:send",  text: "..." }
 *   { type: "chat:typing" }
 *   { type: "chat:read" }
 *
 * Messages (server → client):
 *   { type: "chat:message", ... }
 *   { type: "chat:typing", sender_type, reservation_id }
 *   { type: "chat:read",   reservation_id }
 *   { type: "notification", title, body }
 */

import { WebSocketServer } from "ws";
import pg from "pg";

const PORT = parseInt(process.env.WS_PORT || "3001", 10);
const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://milad@/guesthub?host=/var/run/postgresql";

const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 10 });

/* ── Connection registries ─────────────────────────────────── */
// guestConns: Map<reservationId, Set<ws>>
const guestConns = new Map();
// staffConns: Set<ws>
const staffConns = new Set();

/* ── Auth helpers ──────────────────────────────────────────── */
async function authGuest(token) {
  if (!token) return null;
  const res = await pool.query(
    `SELECT gs.guest_id, gs.reservation_id, g.first_name, g.last_name,
            r.room_id, rm.room_number, gs.qr_token AS token
     FROM guest_sessions gs
     JOIN guests g ON g.id = gs.guest_id
     JOIN reservations r ON r.id = gs.reservation_id
     JOIN rooms rm ON rm.id = r.room_id
     WHERE gs.session_token = $1 AND gs.expires_at > NOW()
     LIMIT 1`,
    [token],
  );
  return res.rows[0] || null;
}

async function authStaff(token) {
  if (!token) return null;
  const res = await pool.query(
    `SELECT u.id, u.full_name
     FROM app_sessions s
     JOIN app_users u ON u.id = s.user_id
     WHERE s.session_token = $1 AND s.expires_at > NOW() AND u.is_active = TRUE
     LIMIT 1`,
    [token],
  );
  return res.rows[0] || null;
}

/* ── Broadcast helpers ─────────────────────────────────────── */
function sendJSON(ws, data) {
  if (ws.readyState === 1) ws.send(JSON.stringify(data));
}

function broadcastToRoom(reservationId, data, excludeWs) {
  const conns = guestConns.get(reservationId);
  if (conns) {
    for (const ws of conns) {
      if (ws !== excludeWs) sendJSON(ws, data);
    }
  }
}

function broadcastToStaff(data, excludeWs) {
  for (const ws of staffConns) {
    if (ws !== excludeWs) sendJSON(ws, data);
  }
}

/* ── WebSocket Server ──────────────────────────────────────── */
const wss = new WebSocketServer({ port: PORT });

wss.on("connection", async (ws, req) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const guestToken = url.searchParams.get("token");
  const staffToken = url.searchParams.get("session");

  let role = null; // "guest" | "staff"
  let guestCtx = null;
  let staffCtx = null;

  // Authenticate
  if (guestToken) {
    guestCtx = await authGuest(guestToken);
    if (!guestCtx) {
      sendJSON(ws, { type: "error", message: "Unauthorized" });
      ws.close(4001, "Unauthorized");
      return;
    }
    role = "guest";
    // Register in room
    if (!guestConns.has(guestCtx.reservation_id)) {
      guestConns.set(guestCtx.reservation_id, new Set());
    }
    guestConns.get(guestCtx.reservation_id).add(ws);
    sendJSON(ws, {
      type: "connected",
      role: "guest",
      reservationId: guestCtx.reservation_id,
    });
  } else if (staffToken) {
    staffCtx = await authStaff(staffToken);
    if (!staffCtx) {
      sendJSON(ws, { type: "error", message: "Unauthorized" });
      ws.close(4001, "Unauthorized");
      return;
    }
    role = "staff";
    staffConns.add(ws);
    sendJSON(ws, { type: "connected", role: "staff", userId: staffCtx.id });
  } else {
    ws.close(4000, "Missing auth params");
    return;
  }

  /* ── Handle messages ──────────────────────────────────────── */
  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "chat:send") {
      const text = (msg.text || "").trim();
      if (!text || text.length > 2000) return;

      if (role === "guest") {
        // Guest sends message
        const result = await pool.query(
          `INSERT INTO chat_messages (reservation_id, sender_type, sender_guest_id, message)
           VALUES ($1, 'guest', $2, $3) RETURNING id, created_at`,
          [guestCtx.reservation_id, guestCtx.guest_id, text],
        );
        const row = result.rows[0];
        const payload = {
          type: "chat:message",
          id: row.id,
          reservation_id: guestCtx.reservation_id,
          sender_type: "guest",
          sender_name: `${guestCtx.first_name} ${guestCtx.last_name}`,
          room_number: guestCtx.room_number,
          message: text,
          created_at: row.created_at,
        };
        // Broadcast to room (other guests in same reservation)
        broadcastToRoom(guestCtx.reservation_id, payload, null);
        // Broadcast to all staff
        broadcastToStaff(payload, null);
      } else if (role === "staff") {
        // Staff sends message — needs target reservation_id
        const reservationId = msg.reservationId;
        if (!reservationId) return;

        const result = await pool.query(
          `INSERT INTO chat_messages (reservation_id, sender_type, sender_staff_id, message)
           VALUES ($1, 'staff', $2, $3) RETURNING id, created_at`,
          [reservationId, staffCtx.id, text],
        );
        const row = result.rows[0];
        const payload = {
          type: "chat:message",
          id: row.id,
          reservation_id: reservationId,
          sender_type: "staff",
          sender_name: staffCtx.full_name,
          message: text,
          created_at: row.created_at,
        };
        // Broadcast to guest room
        broadcastToRoom(reservationId, payload, null);
        // Broadcast to other staff
        broadcastToStaff(payload, ws);
      }
    }

    if (msg.type === "chat:typing") {
      if (role === "guest") {
        broadcastToStaff(
          { type: "chat:typing", sender_type: "guest", reservation_id: guestCtx.reservation_id },
          null,
        );
      } else if (role === "staff" && msg.reservationId) {
        broadcastToRoom(
          msg.reservationId,
          { type: "chat:typing", sender_type: "staff", reservation_id: msg.reservationId },
          null,
        );
      }
    }

    if (msg.type === "chat:read") {
      if (role === "guest") {
        await pool.query(
          `UPDATE chat_messages SET is_read = TRUE
           WHERE reservation_id = $1 AND sender_type = 'staff' AND NOT is_read`,
          [guestCtx.reservation_id],
        );
        broadcastToStaff(
          { type: "chat:read", reservation_id: guestCtx.reservation_id },
          null,
        );
      } else if (role === "staff" && msg.reservationId) {
        await pool.query(
          `UPDATE chat_messages SET is_read = TRUE
           WHERE reservation_id = $1 AND sender_type = 'guest' AND NOT is_read`,
          [msg.reservationId],
        );
        broadcastToRoom(
          msg.reservationId,
          { type: "chat:read", reservation_id: msg.reservationId },
          null,
        );
      }
    }
  });

  /* ── Cleanup on disconnect ─────────────────────────────────── */
  ws.on("close", () => {
    if (role === "guest" && guestCtx) {
      const set = guestConns.get(guestCtx.reservation_id);
      if (set) {
        set.delete(ws);
        if (set.size === 0) guestConns.delete(guestCtx.reservation_id);
      }
    } else if (role === "staff") {
      staffConns.delete(ws);
    }
  });
});

console.log(`🟢 GuestHub WS Chat Server running on port ${PORT}`);

/* ── Graceful shutdown ─────────────────────────────────────── */
process.on("SIGINT", () => {
  wss.close();
  pool.end();
  process.exit(0);
});
process.on("SIGTERM", () => {
  wss.close();
  pool.end();
  process.exit(0);
});
