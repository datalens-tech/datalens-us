import {Model} from '../../..';

export class DataExport extends Model {
    static get tableName() {
        return 'data_exports';
    }

    static get idColumn() {
        return 'dataExportId';
    }

    dataExportId!: string;
    title!: string;
    tenantId!: string;
    chartId!: Nullable<string>;
    chartRevId!: Nullable<string>;
    datasetId!: Nullable<string>;
    datasetRevId!: Nullable<string>;
    connectionId!: Nullable<string>;
    connectionRevId!: Nullable<string>;
    params!: Record<string, unknown>;
    createdBy!: string;
    updatedBy!: Nullable<string>;
    createdAt!: string;
    updatedAt!: Nullable<string>;
    expiredAt!: string;
    jobId!: string;
    resultLink!: Nullable<string>;
    error!: Nullable<Record<string, unknown>>;
}
