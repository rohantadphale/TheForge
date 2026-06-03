#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDS=()
LOG_DIR="$ROOT_DIR/.logs"
PROPERTIES_FILE="$ROOT_DIR/forge.properties"

property_value() {
  local key="$1"
  local default_value="$2"
  local value

  if [ ! -f "$PROPERTIES_FILE" ]; then
    printf '%s' "$default_value"
    return
  fi

  value="$(awk -F= -v key="$key" '
    $0 !~ /^[[:space:]]*#/ && $1 == key {
      value = substr($0, index($0, "=") + 1)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
      print value
      exit
    }
  ' "$PROPERTIES_FILE")"

  printf '%s' "${value:-$default_value}"
}

is_truthy() {
  case "$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')" in
    true|yes|on|1) return 0 ;;
    *) return 1 ;;
  esac
}

kill_tree() {
  local pid="$1"
  local child

  while read -r child; do
    if [ -n "$child" ]; then
      kill_tree "$child"
    fi
  done < <(pgrep -P "$pid" 2>/dev/null || true)

  kill "$pid" 2>/dev/null || true
}

cleanup() {
  if [ "${#PIDS[@]}" -gt 0 ]; then
    for pid in "${PIDS[@]}"; do
      kill_tree "$pid"
    done
    wait "${PIDS[@]}" 2>/dev/null || true
  fi

  for port in 8000 5173; do
    while read -r pid; do
      if [ -n "$pid" ]; then
        kill_tree "$pid"
      fi
    done < <(lsof -ti ":$port" 2>/dev/null || true)
  done
}

trap cleanup EXIT INT TERM

if [ ! -x "$ROOT_DIR/backend/.venv/bin/uvicorn" ] || [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
  "$ROOT_DIR/setup.sh"
fi

mkdir -p "$LOG_DIR"

cd "$ROOT_DIR/backend"
".venv/bin/uvicorn" main:app --reload --port 8000 >"$LOG_DIR/backend.log" 2>&1 &
PIDS+=("$!")

cd "$ROOT_DIR/frontend"
npm run dev >"$LOG_DIR/frontend.log" 2>&1 &
PIDS+=("$!")

if is_truthy "$(property_value "animation.enabled" "true")"; then
  python3 "$ROOT_DIR/scripts/forge_fire.py" "$PROPERTIES_FILE"
else
  echo "Backend:  http://localhost:8000"
  echo "Frontend: http://localhost:5173"
  echo "Logs:     .logs/backend.log and .logs/frontend.log"
  echo "Animation disabled in forge.properties. Press Ctrl+C to stop services."
  while true; do
    sleep 3600
  done
fi
