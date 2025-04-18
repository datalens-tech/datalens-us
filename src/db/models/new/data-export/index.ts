import {Model} from '../../..';

export enum DataExportStatus {
    InProgress = 'IN_PROGRESS',
    Cancelled = 'CANCELLED',
    Finished = 'FINISHED',
    Failed = 'FAILED',
}

export class DataExport extends Model {
    static get tableName() {
        return 'data_exports';
    }

    static get idColumn() {
        return 'dataExportId';
    }

    dataExportId!: string;
    tenantId!: string;
    chartId!: Nullable<string>;
    chartRevId!: Nullable<string>;
    datasetId!: Nullable<string>;
    datasetRevId!: Nullable<string>;
    connectionId!: Nullable<string>;
    connectionRevId!: Nullable<string>;
    params!: Record<string, unknown>;
    createdBy!: string;
    createdAt!: string;
    expiredAt!: string;
    jobId!: string;
    s3Key!: Nullable<string>;
    uploadId!: Nullable<string>;
    error!: Nullable<Record<string, unknown>>;
    status!: DataExportStatus;
    size!: Nullable<string>;
    finishedAt!: Nullable<string>;
    cancelledBy!: Nullable<string>;
    cancelledAt!: Nullable<string>;
}
