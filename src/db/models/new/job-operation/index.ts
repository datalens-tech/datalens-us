import {Model} from '../../..';

export const JobOperationColumn = {
    OperationId: 'operationId',
    CurrentJobId: 'currentJobId',
    Meta: 'meta',
} as const;

export class JobOperationModel extends Model {
    static get tableName() {
        return 'job_operations';
    }

    static get idColumn() {
        return JobOperationColumn.OperationId;
    }

    [JobOperationColumn.OperationId]!: string;
    [JobOperationColumn.CurrentJobId]!: Nullable<string>;
    [JobOperationColumn.Meta]!: Record<string, unknown>;
}
