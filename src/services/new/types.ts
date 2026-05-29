import {AppContext} from '@gravity-ui/nodekit';
import {TransactionOrKnex} from 'objection';

import {MainDbTransactionOrKnex} from '../../db';

interface ServiceArgsBase {
    ctx: AppContext;
    /** @deprecated use mainTrx */
    trx?: TransactionOrKnex;
    mainTrx?: MainDbTransactionOrKnex;
    skipValidation?: boolean;
    skipCheckPermissions?: boolean;
    checkLicense?: boolean;
}

type TrxKeys = {
    [K in keyof ServiceArgsBase]-?: NonNullable<ServiceArgsBase[K]> extends TransactionOrKnex
        ? K
        : never;
}[keyof ServiceArgsBase];

/**
 * Укажите явно какие транзакции нужны сервису.
 * @example ServiceArgs<'mainTrx'>
 */
export type ServiceArgs<K extends TrxKeys = TrxKeys> = Omit<ServiceArgsBase, TrxKeys> &
    Pick<ServiceArgsBase, K>;

export type CountAggregation = undefined | {count?: string};
