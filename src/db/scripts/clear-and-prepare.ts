require('dotenv').config();
require('../../index');
import {Utils} from '../../utils/utils';
import {helpers} from '../index';

let dsnList;

try {
    dsnList = Utils.getDsnList();
} catch (e) {
    console.error(e);
    process.exit(1);
    throw e; // Type guard for typescript
}
const PROD_DB_KEY = 'prod';
const CI_DB_KEY = 'ci_purgeable';
const dbSuitable = dsnList.indexOf(PROD_DB_KEY) === -1 && dsnList.indexOf(CI_DB_KEY) !== -1;

if (!dbSuitable) {
    console.error(
        'This script can be executed only on databases with "ci_purgeable" and without "prod" in name',
    );
    process.exit(1);
}

if (process.env.QLOUD_INSTALLATION) {
    console.error('This script should not be executed on deployed instances');
    process.exit(1);
}

helpers
    .clearDatabase()
    .then(() => helpers.prepareDatabase())
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
