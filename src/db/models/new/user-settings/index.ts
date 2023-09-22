import {Model} from '../../..';

export class UserSettings extends Model {
    static get tableName() {
        return 'userSettings';
    }

    static get idColumn() {
        return 'userId';
    }

    userId!: string;
    settings!: Record<string, unknown>;
    updatedAt!: string;
}
