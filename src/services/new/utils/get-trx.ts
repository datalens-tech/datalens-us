import {TransactionOrKnex} from 'objection';

import {Model} from '../../../db';

/** @deprecated use queryPrimary(Model, trx) */
export const getPrimary = (trx?: TransactionOrKnex): TransactionOrKnex => trx ?? Model.primary;

/** @deprecated use queryReplica(Model, trx) */
export const getReplica = (trx?: TransactionOrKnex): TransactionOrKnex => trx ?? Model.replica;
