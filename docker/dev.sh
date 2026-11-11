#!/bin/sh
# Servidor de desenvolvimento do container.
# - Código: a pasta do projeto é montada em /app, então salvar um arquivo já
#   atualiza a página (hot reload do Astro).
# - Dependências: se o package-lock.json mudar (npm install de algo novo),
#   este script roda o npm install e reinicia o Astro sozinho. Sem --build.
cd /app

hash_lock() { md5sum package-lock.json | cut -d' ' -f1; }
hash_instalado() { cat node_modules/.lock-hash 2>/dev/null; }

instalar_se_mudou() {
  if [ "$(hash_lock)" != "$(hash_instalado)" ]; then
    echo "[docker] dependências mudaram: rodando npm install..."
    npm install --no-audit --no-fund && hash_lock > node_modules/.lock-hash
  fi
}

PID=
trap '[ -n "$PID" ] && kill "$PID" 2>/dev/null; exit 0' TERM INT

instalar_se_mudou
while true; do
  npx astro dev --host 0.0.0.0 --port 4321 &
  PID=$!
  while kill -0 "$PID" 2>/dev/null; do
    sleep 3
    if [ "$(hash_lock)" != "$(hash_instalado)" ]; then
      echo "[docker] package-lock.json mudou: reiniciando o Astro..."
      kill "$PID"; wait "$PID" 2>/dev/null
    fi
  done
  instalar_se_mudou
  sleep 1
done
