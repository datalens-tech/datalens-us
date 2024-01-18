/* eslint-disable camelcase */
/* This script facilitates migration of aliases for favorites and can be deleted after release */
require('dotenv').config();
require('../../index');
import {db} from '../index';

(async function () {
    try {
        await db.ready();

        const favorites = await db.primary.raw(
            `SELECT entry_id, tenant_id, login, alias, display_alias 
             FROM favorites 
             WHERE alias IS NOT NULL AND alias != '' AND display_alias IS NULL`,
        );

        for (const entry of favorites.rows) {
            const {entry_id, tenant_id, login, alias} = entry;

            await db.primary
                .table('favorites')
                .update({alias: alias.toLowerCase(), display_alias: alias})
                .where({entry_id, tenant_id, login});
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
