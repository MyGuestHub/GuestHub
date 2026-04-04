#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -eq 0 ]]; then
  echo "[run-with-ws] Missing app command. Usage: scripts/run-with-ws.sh <command...>" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

WS_PORT="${WS_PORT:-3001}"
WS_MANAGED=0

is_port_in_use() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltn | awk '{print $4}' | grep -qE "[:.]${WS_PORT}$"
    return $?
  fi
  if command -v netstat >/dev/null 2>&1; then
    netstat -ltn 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${WS_PORT}$"
    return $?
  fi
  return 1
}

if is_port_in_use; then
  echo "[run-with-ws] WS port ${WS_PORT} is already in use. Reusing existing WS server."
  WS_PID=""
else
  echo "[run-with-ws] Starting WS server on port ${WS_PORT}..."
  node "$ROOT_DIR/scripts/ws-chat-server.mjs" &
  WS_PID=$!
  WS_MANAGED=1
fi

echo "[run-with-ws] Starting app command: $*"
"$@" &
APP_PID=$!

cleanup() {
  if kill -0 "$APP_PID" 2>/dev/null; then
    kill "$APP_PID" 2>/dev/null || true
  fi
  if [[ "$WS_MANAGED" -eq 1 ]] && kill -0 "$WS_PID" 2>/dev/null; then
    kill "$WS_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

set +e
if [[ "$WS_MANAGED" -eq 1 ]]; then
  wait -n "$APP_PID" "$WS_PID"
else
  wait "$APP_PID"
fi
FIRST_EXIT_CODE=$?
set -e

if [[ "$WS_MANAGED" -eq 1 ]] && ! kill -0 "$WS_PID" 2>/dev/null; then
  wait "$WS_PID" || true
  echo "[run-with-ws] WS server stopped unexpectedly." >&2
  exit 1
fi

wait "$APP_PID"
APP_EXIT_CODE=$?
exit "$APP_EXIT_CODE"
