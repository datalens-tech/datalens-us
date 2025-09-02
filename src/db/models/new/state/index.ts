import {Model} from '../../..';

export const StateColumn = {
    Hash: 'hash',
    EntryId: 'entryId',
    Data: 'data',
    CreatedAt: 'createdAt',
} as const;

export const StateColumnRaw = {
    Hash: 'hash',
    EntryId: 'entry_id',
    Data: 'data',
    CreatedAt: 'created_at',
} as const;

export class State extends Model {
    static get tableName() {
        return 'states';
    }

    static get idColumn() {
        return [StateColumn.Hash, StateColumn.EntryId];
    }

    [StateColumn.Hash]!: string;
    [StateColumn.EntryId]!: string;
    [StateColumn.Data]!: Nullable<Record<string, unknown>>;
    [StateColumn.CreatedAt]!: string;
}
