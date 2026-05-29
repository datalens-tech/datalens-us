/* eslint-disable no-restricted-imports, no-restricted-syntax */
import {QueryBuilder, transaction} from 'objection';

import {BrandedModelClass, BrandedTransactionOrKnex} from './types/brands';

export function dbTransaction<M extends BrandedModelClass, T>(
    {trxProvider, trx}: {trxProvider: M; trx?: BrandedTransactionOrKnex<M['__dbBrand']>},
    fn: (trx: BrandedTransactionOrKnex<M['__dbBrand']>) => Promise<T>,
): Promise<T> {
    return transaction(trx ?? trxProvider.primary, (rawTrx) =>
        fn(rawTrx as BrandedTransactionOrKnex<M['__dbBrand']>),
    );
}

export const queryPrimary = <M extends BrandedModelClass>(
    ModelClass: M,
    trx?: BrandedTransactionOrKnex<M['__dbBrand']>,
): QueryBuilder<InstanceType<M>> =>
    ModelClass.query(trx ?? ModelClass.primary) as unknown as QueryBuilder<InstanceType<M>>;

export const queryReplica = <M extends BrandedModelClass>(
    ModelClass: M,
    trx?: BrandedTransactionOrKnex<M['__dbBrand']>,
): QueryBuilder<InstanceType<M>> =>
    ModelClass.query(trx ?? ModelClass.replica) as unknown as QueryBuilder<InstanceType<M>>;
