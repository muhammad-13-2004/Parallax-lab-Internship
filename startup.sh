#!/bin/sh
set -eu
cd /workspace
# :8081 is QA-only — a revive must never inherit a stale built-output preview.
node scripts/preview.mjs stop || true

if ! node -e "const net=require('net'); const socket=net.connect({host:'127.0.0.1',port:8082}); socket.on('connect',()=>process.exit(0)); socket.on('error',()=>process.exit(1)); socket.on('timeout',()=>process.exit(1)); socket.setTimeout(1000);"; then
  node scripts/inventory-server.mjs >>/tmp/inventory-server.log 2>&1 &
fi

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
