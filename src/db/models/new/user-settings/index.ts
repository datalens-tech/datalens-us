import {Model} from '../../..';

export class UserSettings extends Model {
    static get tableName() {
        return 'userSettings';
    }

    static get idColumn() {
        return 'userId';
    }

    userId!: string;
    tenantId!: string;
    settings!: Record<string, unknown>;
    updatedAt!: string;
}
