import {AppContext} from '@gravity-ui/nodekit';
import {TransactionOrKnex} from 'objection';

export interface ServiceArgs {
    ctx: AppContext;
    trx?: TransactionOrKnex;
    skipValidation?: boolean;
    skipCheckPermissions?: boolean;
    skipLicenseCheck?: boolean;
}

export type CountAggregation = undefined | {count?: string};
