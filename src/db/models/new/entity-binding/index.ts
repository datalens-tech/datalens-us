import {Model} from '../../..';

import type {EntityBindingTargetType} from './types';

export const EntityBindingModelColumn = {
    SourceId: 'sourceId',
    TargetId: 'targetId',
    TargetType: 'targetType',
    IsDelegated: 'isDelegated',
    CreatedBy: 'createdBy',
    CreatedAt: 'createdAt',
    UpdatedBy: 'updatedBy',
    UpdatedAt: 'updatedAt',
} as const;

export class EntityBindingModel extends Model {
    static get tableName() {
        return 'entity_bindings';
    }

    static get idColumn() {
        return [EntityBindingModelColumn.SourceId, EntityBindingModelColumn.TargetId];
    }

    [EntityBindingModelColumn.SourceId]!: string;
    [EntityBindingModelColumn.TargetId]!: string;
    [EntityBindingModelColumn.TargetType]!: `${EntityBindingTargetType}`;
    [EntityBindingModelColumn.IsDelegated]!: boolean;
    [EntityBindingModelColumn.CreatedBy]!: string;
    [EntityBindingModelColumn.CreatedAt]!: string;
    [EntityBindingModelColumn.UpdatedBy]!: string;
    [EntityBindingModelColumn.UpdatedAt]!: string;
}
