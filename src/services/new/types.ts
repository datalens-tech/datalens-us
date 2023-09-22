import {TransactionOrKnex} from 'objection';
import {AppContext} from '@gravity-ui/nodekit';

export interface ServiceArgs {
    ctx: AppContext;
    trx?: TransactionOrKnex;
    skipValidation?: boolean;
    skipCheckPermissions?: boolean;
}

export type CountAggregation = undefined | {count?: string};
