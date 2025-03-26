require('dotenv').config();
require('../../index');
import {helpers} from '../index';

if (process.env.PROHIBIT_MIGRATIONS) {
    console.error('Migrations are prohibited in this env!');
    process.exit(1);
}

helpers
    .migrateDatabase()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
