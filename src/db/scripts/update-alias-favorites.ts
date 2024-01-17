/* eslint-disable camelcase */
require('dotenv').config();
require('../../index');
import {db} from '../index';

(async function () {
    try {
        await db.ready();

        const favorites = await db.primary.raw(
            `SELECT entry_id, tenant_id, login, display_alias FROM favorites`,
        );

        for (const entry of favorites.rows) {
            const {entry_id, tenant_id, login, display_alias} = entry;
            const alias = display_alias ? display_alias.toLowerCase() : display_alias;
            await db.primary.table('favorites').update({alias}).where({entry_id, tenant_id, login});
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
