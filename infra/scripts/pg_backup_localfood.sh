#!/usr/bin/env bash
set -euo pipefail

DB_NAME="localfood"
BACKUP_DIR="/var/backups/localfood"
RETENTION_DAYS="7"

TIMESTAMP="$(date +'%Y-%m-%d_%H-%M-%S')"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.dump"
TMP_FILE="${BACKUP_FILE}.tmp"

if [ "$(id -u)" -ne 0 ]; then
  echo "Error: this script must be run as root." >&2
  exit 1
fi

install -d -m 700 -o root -g root "${BACKUP_DIR}"

sudo -u postgres pg_dump \
  --format=custom \
  --no-password \
  --dbname="${DB_NAME}" \
  > "${TMP_FILE}"

chmod 600 "${TMP_FILE}"
mv "${TMP_FILE}" "${BACKUP_FILE}"

find "${BACKUP_DIR}" \
  -type f \
  -name "${DB_NAME}_*.dump" \
  -mtime +"${RETENTION_DAYS}" \
  -delete

echo "Backup created: ${BACKUP_FILE}"
