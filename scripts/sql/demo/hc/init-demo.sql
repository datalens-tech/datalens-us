\COPY workbooks FROM '/opt/app/scripts/sql/demo/hc/workbooks.csv' (FORMAT csv);
\COPY entries FROM '/opt/app/scripts/sql/demo/hc/entries.csv' (FORMAT csv);
\COPY revisions FROM '/opt/app/scripts/sql/demo/hc/revisions.csv' (FORMAT csv);
\COPY links FROM '/opt/app/scripts/sql/demo/hc/links.csv' (FORMAT csv);