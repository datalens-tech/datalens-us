import {Model} from '../init-db';

import {BrandedTransactionOrKnex} from './brands';

export type MainDbTransactionOrKnex = BrandedTransactionOrKnex<typeof Model.__dbBrand>;
