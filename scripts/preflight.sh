#!/bin/sh
set -e

if [ "$SKIP_INSTALL_DB_EXTENSIONS" = "1" ]; then
    echo 'Skip extensions setting up'
else
    echo "Start setting up extensions"
    node /opt/app/dist/server/db/scripts/extensions.js
    echo "Finish setting up extensions"
fi;

echo "Start migration"
npm run db:migrate
echo "Finish migration"

if [ "$USE_DEMO_DATA" = "1" ]; then
    echo "Start setting up demo data"
    if [ "$HC" = "1" ]; then
        echo "Use HC demo data"
        node /opt/app/dist/server/db/scripts/demo/hc.js
    else
        echo "Use D3 demo data"
        node /opt/app/dist/server/db/scripts/demo/d3.js
    fi
    echo "Finish setting up demo data"
fi

if [ "$USE_E2E_MOCK_DATA" = "1" ]; then
    echo "Start setting up e2e data"
    node /opt/app/dist/server/db/scripts/e2e/init-united-storage-data.js
    echo "Finish setting up e2e data"
fi

supervisorctl -c /etc/supervisor/conf.d/supervisor.conf start node
supervisorctl -c /etc/supervisor/conf.d/supervisor.conf start nginx
