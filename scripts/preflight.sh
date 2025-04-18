#!/bin/sh
set -e

if [ "${SKIP_INSTALL_DB_EXTENSIONS}" = "1" ]; then
  echo '{"level":"INFO","msg":"Skip extensions setting up"}'
else
  echo '{"level":"INFO","msg":"Start setting up extensions"}'
  node /opt/app/dist/server/db/scripts/extensions.js
  echo '{"level":"INFO","msg":"Finish setting up extensions"}'
fi

echo '{"level":"INFO","msg":"Start migration"}'
npm run db:migrate
echo '{"level":"INFO","msg":"Finish migration"}'

exec 'node' 'dist/server'
