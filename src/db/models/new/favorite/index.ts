import {Model} from '../../..';
import {Entry} from '../entry';

export const FavoriteColumn = {
    EntryId: 'entryId',
    TenantId: 'tenantId',
    Login: 'login',
    Alias: 'alias',
    CreatedAt: 'createdAt',
} as const;

export class Favorite extends Model {
    static get tableName() {
        return 'favorites';
    }

    static get idColumn() {
        return 'entryId';
    }

    static get relationMappings() {
        return {
            entry: {
                relation: Model.BelongsToOneRelation,
                modelClass: Entry,
                join: {
                    from: `${Favorite.tableName}.entryId`,
                    to: `${Entry.tableName}.entryId`,
                },
            },
        };
    }

    entryId!: string;
    tenantId!: string;
    login!: string;
    alias!: string | null;
    createdAt!: string;

    entry?: Entry;
}
