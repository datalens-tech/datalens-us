import {Model} from '../../..';

export const LockColumn = {
    LockId: 'lockId',
    EntryId: 'entryId',
    LockToken: 'lockToken',
    ExpiryDate: 'expiryDate',
    StartDate: 'startDate',
    Login: 'login',
} as const;

export const LockColumnRaw = {
    LockId: 'lock_id',
    EntryId: 'entry_id',
    LockToken: 'lock_token',
    ExpiryDate: 'expiry_date',
    StartDate: 'start_date',
    Login: 'login',
} as const;

export class Lock extends Model {
    static get tableName() {
        return 'locks';
    }

    static get idColumn() {
        return LockColumn.LockId;
    }

    [LockColumn.LockId]!: string;
    [LockColumn.EntryId]!: string;
    [LockColumn.LockToken]!: string;
    [LockColumn.ExpiryDate]!: string;
    [LockColumn.StartDate]!: string;
    [LockColumn.Login]!: Nullable<string>;
}
