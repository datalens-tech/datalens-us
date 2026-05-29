import {getModel} from '@gravity-ui/postgreskit';
import {TransactionOrKnex} from 'objection';

declare const __dbBrand: unique symbol;

export type BrandedTransactionOrKnex<B extends string> = TransactionOrKnex & {
    readonly [__dbBrand]: B;
};

export type BrandedModelClass = ReturnType<typeof getModel> & {readonly __dbBrand: string};
