import {Model} from '../../..';

export class Link extends Model {
    static get tableName() {
        return 'links';
    }

    static get idColumn() {
        return ['fromId', 'toId'];
    }

    fromId!: string;
    toId!: string;
    name!: string;
}
