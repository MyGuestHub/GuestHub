#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-guesthub}"
DB_OWNER="${DB_OWNER:-$USER}"

if psql -lqt | cut -d '|' -f 1 | sed 's/^ *//;s/ *$//' | grep -qx "$DB_NAME"; then
  echo "Database '$DB_NAME' already exists."
else
  echo "Creating database '$DB_NAME' with owner '$DB_OWNER'..."
  createdb -O "$DB_OWNER" "$DB_NAME"
fi

echo "Applying schema files..."
for file in $(ls db/*.sql | sort); do
  echo "- Running $file"
  psql -d "$DB_NAME" -f "$file"
done

echo "Done. Database is ready: $DB_NAME"
