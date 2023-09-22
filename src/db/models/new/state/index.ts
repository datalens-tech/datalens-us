import {Model} from '../../..';

export class State extends Model {
    static get tableName() {
        return 'states';
    }

    static get idColumn() {
        return ['hash', 'entryId'];
    }

    hash!: string;
    entryId!: string;
    data!: Nullable<Record<string, unknown>>;
    createdAt!: string;
}
