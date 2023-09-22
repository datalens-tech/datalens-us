import {Model} from '../../..';

export class Template extends Model {
    static get tableName() {
        return 'templates';
    }

    static get idColumn() {
        return 'name';
    }

    name!: string;
    data!: Nullable<Record<string, unknown>>;
}
