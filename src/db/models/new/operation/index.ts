import {Model} from '../../..';

export enum OperationStatus {
    Scheduled = 'scheduled',
    Failed = 'failed',
    Done = 'done',
}

export const OperationModelColumn = {
    OperationId: 'operationId',
    Type: 'type',
    CreatedAt: 'createdAt',
    CreatedBy: 'createdBy',
    UpdatedAt: 'updatedAt',
    Result: 'result',
    Status: 'status',
    Meta: 'meta',
    InnerMeta: 'innerMeta',
    RunAfter: 'runAfter',
    RetriesLeft: 'retriesLeft',
    RetriesIntervalSec: 'retriesIntervalSec',
    TenantId: 'tenantId',
} as const;

export const OperationModelColumnRaw = {
    OperationId: 'operation_id',
    Type: 'type',
    CreatedAt: 'created_at',
    CreatedBy: 'created_by',
    UpdatedAt: 'updated_at',
    Result: 'result',
    Status: 'status',
    Meta: 'meta',
    InnerMeta: 'inner_meta',
    RunAfter: 'run_after',
    RetriesLeft: 'retries_left',
    RetriesIntervalSec: 'retries_interval_sec',
    TenantId: 'tenant_id',
} as const;

export class OperationModel extends Model {
    static get tableName() {
        return 'operations';
    }

    static get idColumn() {
        return OperationModelColumn.OperationId;
    }

    [OperationModelColumn.OperationId]!: string;
    [OperationModelColumn.Type]!: string;
    [OperationModelColumn.CreatedAt]!: string;
    [OperationModelColumn.CreatedBy]!: string;
    [OperationModelColumn.UpdatedAt]!: string;
    [OperationModelColumn.Result]!: Record<string, unknown>;
    [OperationModelColumn.Status]!: OperationStatus;
    [OperationModelColumn.Meta]!: Record<string, unknown>;
    [OperationModelColumn.InnerMeta]!: Record<string, unknown>;
    [OperationModelColumn.RunAfter]!: string;
    [OperationModelColumn.RetriesLeft]!: number;
    [OperationModelColumn.RetriesIntervalSec]!: number;
    [OperationModelColumn.TenantId]!: Nullable<string>;
}
