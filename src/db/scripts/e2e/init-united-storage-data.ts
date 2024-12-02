require('dotenv').config();
require('../../../index');
import * as fs from 'fs';

import {db} from '../../index';

const E2E_WORKBOOK_ID = '1540491943966934028';
const PATH_TO_DATA = `/opt/e2e-data/us-e2e-data`;

(async function () {
    try {
        await db.ready();

        const result = await db.primary.raw(
            `SELECT COUNT(*) AS count FROM workbooks WHERE workbook_id = ${E2E_WORKBOOK_ID};`,
        );

        if (result && result.rows && result.rows[0] && result.rows[0].count === '0') {
            const sqlData = fs.readFileSync(PATH_TO_DATA, 'utf8').toString().trim();
            await db.primary.raw(sqlData);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
