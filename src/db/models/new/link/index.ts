import {Model} from '../../..';

export const LinkColumn = {
    FromId: 'fromId',
    ToId: 'toId',
    Name: 'name',
} as const;

export class Link extends Model {
    static get tableName() {
        return 'links';
    }

    static get idColumn() {
        return [LinkColumn.FromId, LinkColumn.ToId];
    }

    fromId!: string;
    toId!: string;
    name!: string;
}
