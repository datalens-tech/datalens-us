import dotenv from 'dotenv';
dotenv.config();

import '../../index';
import {registry} from '../../registry';

import {checkMigrations} from './utils';

const MIGRATIONS_SOURCE_DIR = 'projects/opensource/src/db/migrations';
const MIGRATIONS_TABLE = 'migrations';

if (require.main === module) {
    const {db} = registry.getDbInstance();

    (async function () {
        try {
            await db.ready();

            const result = await checkMigrations({
                db,
                migrationsSourceDir: MIGRATIONS_SOURCE_DIR,
                migrationsTable: MIGRATIONS_TABLE,
            });

            if (result.ok) {
                console.info(result.message);
                process.exit(0);
            } else {
                console.error(result.message);
                process.exit(1);
            }
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    })();
}
