import {Model} from '../../..';
import {Entry} from '../entry';

export class Lock extends Model {
    static get tableName() {
        return 'locks';
    }

    static get idColumn() {
        return 'lockId';
    }

    static get relationMappings() {
        return {
            entry: {
                relation: Model.BelongsToOneRelation,
                modelClass: Entry,
                join: {
                    from: `${Lock.tableName}.entryId`,
                    to: `${Entry.tableName}.entryId`,
                },
            },
        };
    }

    lockId!: string;
    entryId!: string;
    lockToken!: string;
    expiryDate!: string;
    startDate!: string;
    login!: Nullable<string>;

    entry?: Entry;
}
