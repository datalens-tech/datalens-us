\COPY workbooks FROM '/opt/app/scripts/sql/demo/d3/workbooks.csv' (FORMAT csv);
\COPY entries FROM '/opt/app/scripts/sql/demo/d3/entries.csv' (FORMAT csv);
\COPY revisions FROM '/opt/app/scripts/sql/demo/d3/revisions.csv' (FORMAT csv);
\COPY links FROM '/opt/app/scripts/sql/demo/d3/links.csv' (FORMAT csv);