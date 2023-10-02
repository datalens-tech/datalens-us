require('dotenv').config();
require('../../../index');
import {db} from '../../index';

const DEMO_WORKBOOK_ID = '1507164764046888724';
const PATH_TO_CSV_DATA = `${__dirname}/../../../../../scripts/demo/d3-data`;

(async function () {
    try {
        await db.ready();

        const result = await db.primary.raw(
            `SELECT COUNT(*) AS count FROM workbooks WHERE workbook_id = ${DEMO_WORKBOOK_ID};`,
        );

        if (result && result.rows && result.rows[0] && result.rows[0].count === '0') {
            await db.primary.raw(`
                COPY workbooks FROM '${PATH_TO_CSV_DATA}/workbooks.csv' (FORMAT csv);
                COPY entries FROM '${PATH_TO_CSV_DATA}/entries.csv' (FORMAT csv);
                COPY revisions FROM '${PATH_TO_CSV_DATA}/revisions.csv' (FORMAT csv);
                COPY links FROM '${PATH_TO_CSV_DATA}/links.csv' (FORMAT csv);
            `);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
