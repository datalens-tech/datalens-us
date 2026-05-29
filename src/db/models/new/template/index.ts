import {Model} from '../../..';

export const TemplateColumn = {
    Name: 'name',
    Data: 'data',
} as const;

export class Template extends Model {
    static get tableName() {
        return 'templates';
    }

    static get idColumn() {
        return 'name';
    }

    [TemplateColumn.Name]!: string;
    [TemplateColumn.Data]!: Nullable<Record<string, unknown>>;
}
