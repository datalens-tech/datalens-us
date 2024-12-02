import {TransactionOrKnex} from 'objection';

import {CTX} from './core';

export type SyncLinks = Record<string, string>;

export interface SyncConf {
    entryId: string;
    links: SyncLinks;
    ctx: CTX;
    trxOverride: TransactionOrKnex;
}
