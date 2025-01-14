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
    chartId!: string;
    chartRevId!: string;
    datasetId!: Nullable<string>;
    datasetRevId!: Nullable<string>;
    connectionId!: string;
    connectionRevId!: string;
    params!: Record<string, unknown>;
    createdBy!: string;
    createdAt!: string;
    expiredAt!: string;
    jobId!: string;
    resultLink!: Nullable<string>;
    error!: Nullable<Record<string, unknown>>;
}
