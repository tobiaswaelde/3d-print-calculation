#!/bin/sh
set -eu

image="ezprint:smoke"
container="print-cost-smoke-$$"
volume="print-cost-smoke-$$"
readonly_container="print-cost-readonly-$$"
temporary_directory="$(mktemp -d)"

cleanup() {
  docker rm -f "$container" "$readonly_container" >/dev/null 2>&1 || true
  docker volume rm "$volume" >/dev/null 2>&1 || true
  rm -r "$temporary_directory"
}
trap cleanup EXIT INT TERM

docker build --tag "$image" .
docker volume create "$volume" >/dev/null
docker run -d --restart unless-stopped --name "$container" -p 127.0.0.1::3000 -v "$volume:/data" "$image" >/dev/null

port="$(docker port "$container" 3000/tcp | sed 's/.*://')"
attempt=0
until curl --fail --silent "http://127.0.0.1:$port/api/health" >/dev/null; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then docker logs "$container"; exit 1; fi
  sleep 1
done

docker restart "$container" >/dev/null
port="$(docker port "$container" 3000/tcp | sed 's/.*://')"
attempt=0
until curl --fail --silent "http://127.0.0.1:$port/api/health" >/dev/null; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then docker logs "$container"; exit 1; fi
  sleep 1
done

origin="http://127.0.0.1:$port"
cookie_file="$temporary_directory/cookies.txt"
curl --fail --silent --cookie-jar "$cookie_file" \
  --header 'content-type: application/json' --header "origin: $origin" \
  --data '{"displayName":"Container Test","email":"container@example.test","password":"container-password-123","locale":"en-US","currency":"EUR","electricityPrice":"0.32","printSeriesEnabled":true,"spoolManagementEnabled":true}' \
  "$origin/api/auth/setup" >/dev/null

successful_backup="$temporary_directory/success.ezprint-backup"
curl --fail --silent --cookie "$cookie_file" "$origin/api/backups/download" --output "$successful_backup"
curl --fail --silent --cookie "$cookie_file" --header 'content-type: application/json' --header "origin: $origin" \
  --data '{"name":"Created after backup"}' "$origin/api/manufacturers" >/dev/null
authorization_response="$(curl --fail --silent --cookie "$cookie_file" --header 'content-type: application/json' \
  --header "origin: $origin" --data '{"password":"container-password-123"}' \
  "$origin/api/backups/restore-authorizations")"
restore_token="$(printf '%s' "$authorization_response" | node -e "process.stdin.on('data',d=>process.stdout.write(JSON.parse(d).token))")"
restore_response="$(curl --fail --silent --cookie "$cookie_file" --header "origin: $origin" \
  --header 'content-type: application/vnd.ezprint.backup' --header "x-ezprint-restore-token: $restore_token" \
  --request PUT --data-binary "@$successful_backup" "$origin/api/backups/restores")"
restore_id="$(printf '%s' "$restore_response" | node -e "process.stdin.on('data',d=>process.stdout.write(JSON.parse(d).id))")"

attempt=0
restore_status="pending"
while [ "$restore_status" = "pending" ]; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then docker logs "$container"; exit 1; fi
  sleep 1
  port="$(docker port "$container" 3000/tcp 2>/dev/null | sed 's/.*://' || true)"
  origin="http://127.0.0.1:$port"
  status_response="$(curl --silent "$origin/api/backups/restores/$restore_id" || true)"
  restore_status="$(printf '%s' "$status_response" | node -e "let s=''; process.stdin.on('data',d=>s+=d).on('end',()=>{try{process.stdout.write(JSON.parse(s).status||'pending')}catch{process.stdout.write('pending')}})")"
done
if [ "$restore_status" != "succeeded" ]; then docker logs "$container"; exit 1; fi

session_response="$(curl --fail --silent --cookie "$cookie_file" "$origin/api/auth/session")"
if [ "$session_response" != '{"user":null}' ]; then echo 'Restore did not invalidate sessions' >&2; exit 1; fi
curl --fail --silent --cookie-jar "$cookie_file" --header 'content-type: application/json' --header "origin: $origin" \
  --data '{"email":"container@example.test","password":"container-password-123"}' "$origin/api/auth/login" >/dev/null
manufacturers="$(curl --fail --silent --cookie "$cookie_file" "$origin/api/manufacturers")"
if printf '%s' "$manufacturers" | grep -q 'Created after backup'; then echo 'Restore did not replace data' >&2; exit 1; fi

rollback_backup="$temporary_directory/rollback.ezprint-backup"
docker exec "$container" sh -c 'cp /data/app.db /data/broken.db'
docker exec --env DATABASE_URL=file:/data/broken.db "$container" node --input-type=module -e \
  "import Database from 'better-sqlite3'; const db=new Database('/data/broken.db'); db.pragma('foreign_keys = OFF'); db.prepare('INSERT INTO PrinterComponent (printerId, componentId) VALUES (?, ?)').run('missing-printer', 'missing-component'); db.close();"
docker exec --env DATABASE_URL=file:/data/broken.db "$container" \
  node scripts/backup-database.ts /data/rollback.ezprint-backup >/dev/null
docker cp "$container:/data/rollback.ezprint-backup" "$rollback_backup" >/dev/null
curl --fail --silent --cookie "$cookie_file" --header 'content-type: application/json' --header "origin: $origin" \
  --data '{"name":"Preserved by rollback"}' "$origin/api/manufacturers" >/dev/null
authorization_response="$(curl --fail --silent --cookie "$cookie_file" --header 'content-type: application/json' \
  --header "origin: $origin" --data '{"password":"container-password-123"}' \
  "$origin/api/backups/restore-authorizations")"
restore_token="$(printf '%s' "$authorization_response" | node -e "process.stdin.on('data',d=>process.stdout.write(JSON.parse(d).token))")"
restore_response="$(curl --fail --silent --cookie "$cookie_file" --header "origin: $origin" \
  --header 'content-type: application/vnd.ezprint.backup' --header "x-ezprint-restore-token: $restore_token" \
  --request PUT --data-binary "@$rollback_backup" "$origin/api/backups/restores")"
restore_id="$(printf '%s' "$restore_response" | node -e "process.stdin.on('data',d=>process.stdout.write(JSON.parse(d).id))")"
attempt=0
restore_status="pending"
while [ "$restore_status" = "pending" ]; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then docker logs "$container"; exit 1; fi
  sleep 1
  port="$(docker port "$container" 3000/tcp 2>/dev/null | sed 's/.*://' || true)"
  origin="http://127.0.0.1:$port"
  status_response="$(curl --silent "$origin/api/backups/restores/$restore_id" || true)"
  restore_status="$(printf '%s' "$status_response" | node -e "let s=''; process.stdin.on('data',d=>s+=d).on('end',()=>{try{process.stdout.write(JSON.parse(s).status||'pending')}catch{process.stdout.write('pending')}})")"
done
if [ "$restore_status" != "rolled_back" ]; then docker logs "$container"; exit 1; fi
manufacturers="$(curl --fail --silent --cookie "$cookie_file" "$origin/api/manufacturers")"
if ! printf '%s' "$manufacturers" | grep -q 'Preserved by rollback'; then echo 'Failed restore did not preserve current data' >&2; exit 1; fi

if docker run --name "$readonly_container" --read-only -v "$volume:/data:ro" "$image" >/dev/null 2>&1; then
  echo "Expected an unwritable data directory to fail" >&2
  exit 1
fi
