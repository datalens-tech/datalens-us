import dotenv from 'dotenv';
dotenv.config();

import '../../index';
import {registry} from '../../registry';

if (process.env.PROHIBIT_MIGRATIONS) {
    console.error('Migrations are prohibited in this env!');
    process.exit(1);
}

if (require.main === module) {
    const {helpers} = registry.getDbInstance();

    helpers
        .migrateDatabase({onlyOne: true})
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
