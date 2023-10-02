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
node /opt/app/dist/server/db/scripts/migrate.js
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

supervisorctl start node
supervisorctl start nginx
