#!/usr/bin/env bash
set -Eeuo pipefail
# Candidate-only operator helper. Never touches public production or databases.
name=vega-agent-office-candidate-v06
port=18132
image="${1:?Provide an already-built candidate image}"
case "$image" in vega-agent-office-candidate:*) ;; *) echo "Only candidate images allowed" >&2; exit 2;; esac
docker image inspect "$image" >/dev/null
test "$(docker inspect -f '{{index .HostConfig.PortBindings "3000/tcp" 0 "HostPort"}}' "$name")" = "$port"
prev="$name-rollback-$(date +%s)"
docker stop "$name"
docker rename "$name" "$prev"
rollback(){ docker rm -f "$name" >/dev/null 2>&1 || true; docker rename "$prev" "$name"; docker start "$name"; }
trap rollback ERR
docker run -d --name "$name" --publish "127.0.0.1:$port:3000" --cpus 1 --memory 768m --pids-limit 128 --read-only --tmpfs /tmp:size=64m,mode=1777 --tmpfs /app/.next/cache:size=128m,uid=1000,gid=1000 --cap-drop ALL --security-opt no-new-privileges "$image"
for i in $(seq 1 20); do if curl -fsS --max-time 3 "http://127.0.0.1:$port/" -o /dev/null 2>/dev/null; then break; fi; sleep 1; done
for route in / /demo /evidence /documentation /en /quality-report.md; do curl -fsS --max-time 5 -o /dev/null -w "$route HTTP %{http_code}\n" "http://127.0.0.1:$port$route"; done
trap - ERR
printf 'Candidate validated; prior stopped container retained: %s\n' "$prev"
