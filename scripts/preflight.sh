#!/bin/sh
set -e

echo "Start migration"
if [ $PG_TEST_DATA -eq 1 ]
then
    echo "Initializing postgres test data"
    psql -f /opt/app/scripts/sql/init-data.sql postgres://us:us@pg-us:5432/postgres
fi
if [ $CH_DEMO_DATA -eq 1 ]
then
    echo "Initializing clickhouse demo data"
    if [ $HC -eq 1 ]
    then
        psql -f /opt/app/scripts/sql/demo/hc/init-demo.sql postgres://us:us@pg-us:5432/us-db-ci_purgeable
    else
        psql -f /opt/app/scripts/sql/demo/d3/init-demo.sql postgres://us:us@pg-us:5432/us-db-ci_purgeable
    fi
fi

node /opt/app/dist/server/db/scripts/migrate.js
echo "Finish migration"

supervisorctl start node
supervisorctl start nginx
