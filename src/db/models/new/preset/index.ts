import {Model} from '../../..';

export class Preset extends Model {
    static get tableName() {
        return 'presets';
    }

    static get idColumn() {
        return 'presetId';
    }

    presetId!: string;
    createdAt!: string;
    data!: Record<string, unknown>;
}
