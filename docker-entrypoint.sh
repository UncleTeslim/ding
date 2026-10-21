#!/bin/sh
set -eu

if [ "$(id -u)" -eq 0 ]; then
  chown node:node /app/data
  exec su-exec node "$@"
fi

exec "$@"
