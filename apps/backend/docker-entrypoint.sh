#!/bin/sh
set -e

# Start the bundled Redis only when no external one is configured. REDIS_HOST of
# localhost/127.0.0.1 counts as "internal" so an existing .env keeps working.
use_internal=0
if [ -z "${REDIS_URL:-}" ]; then
  case "${REDIS_HOST:-}" in
  "" | localhost | 127.0.0.1) use_internal=1 ;;
  esac
fi

if [ "$use_internal" = "1" ]; then
  echo "[entrypoint] no external Redis configured - starting bundled redis-server"
  mkdir -p /data

  # Backgrounded rather than --daemonize so Redis logs reach container stdout.
  if [ -n "${REDIS_PASSWORD:-}" ]; then
    redis-server /etc/redis/internal.conf --requirepass "$REDIS_PASSWORD" &
  else
    redis-server /etc/redis/internal.conf &
  fi

  # Every BullMQ worker and Redis socket opens as an import side effect of app.ts,
  # before app.listen — so Redis has to be accepting connections first.
  i=0
  while :; do
    if [ -n "${REDIS_PASSWORD:-}" ]; then
      redis-cli -a "$REDIS_PASSWORD" ping >/dev/null 2>&1 && break
    else
      redis-cli ping >/dev/null 2>&1 && break
    fi
    i=$((i + 1))
    if [ "$i" -gt 100 ]; then
      echo "[entrypoint] bundled redis did not become ready" >&2
      exit 1
    fi
    sleep 0.2
  done

  echo "[entrypoint] bundled redis ready on 127.0.0.1:6379"
  export REDIS_HOST=127.0.0.1
  export REDIS_PORT=6379
else
  echo "[entrypoint] using external Redis: ${REDIS_URL:-$REDIS_HOST:${REDIS_PORT:-6379}}"
fi

# exec so node becomes PID 1 and still receives Docker's signals.
exec "$@"
