#!/bin/sh
set -eu

image="3d-print-calculation:smoke"
container="print-cost-smoke-$$"
volume="print-cost-smoke-$$"
readonly_container="print-cost-readonly-$$"

cleanup() {
  docker rm -f "$container" "$readonly_container" >/dev/null 2>&1 || true
  docker volume rm "$volume" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

docker build --tag "$image" .
docker volume create "$volume" >/dev/null
docker run -d --name "$container" -p 127.0.0.1::3000 -v "$volume:/data" "$image" >/dev/null

port="$(docker port "$container" 3000/tcp | sed 's/.*://')"
attempt=0
until curl --fail --silent "http://127.0.0.1:$port/api/health" >/dev/null; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then docker logs "$container"; exit 1; fi
  sleep 1
done

docker restart "$container" >/dev/null
attempt=0
until curl --fail --silent "http://127.0.0.1:$port/api/health" >/dev/null; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then docker logs "$container"; exit 1; fi
  sleep 1
done

if docker run --name "$readonly_container" --read-only -v "$volume:/data:ro" "$image" >/dev/null 2>&1; then
  echo "Expected an unwritable data directory to fail" >&2
  exit 1
fi
