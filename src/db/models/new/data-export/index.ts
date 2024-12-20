import {Model} from '../../..';

export const DataExportModelColumn = {
    DataExportId: 'dataExportId',
    Title: 'title',
    TenantId: 'tenantId',
    ChartId: 'chartId',
    ChartRevId: 'chartRevId',
    DatasetId: 'datasetId',
    DatasetRevId: 'datasetRevId',
    ConnectionId: 'connectionId',
    ConnectionRevId: 'connectionRevId',
    Params: 'params',
    CreatedBy: 'createdBy',
    CreatedAt: 'createdAt',
    ExpiredAt: 'expiredAt',
    JobId: 'jobId',
    ResultLink: 'resultLink',
    Error: 'error',
} as const;

export class DataExportModel extends Model {
    static get tableName() {
        return 'data_exports';
    }

    static get idColumn() {
        return DataExportModelColumn.DataExportId;
    }

    [DataExportModelColumn.Title]!: string;
    [DataExportModelColumn.TenantId]!: string;
    [DataExportModelColumn.ChartId]!: string;
    [DataExportModelColumn.ChartRevId]!: string;
    [DataExportModelColumn.DatasetId]!: Nullable<string>;
    [DataExportModelColumn.DatasetRevId]!: string;
    [DataExportModelColumn.ConnectionId]!: string;
    [DataExportModelColumn.ConnectionRevId]!: string;
    [DataExportModelColumn.Params]!: Record<string, unknown>;
    [DataExportModelColumn.CreatedBy]!: string;
    [DataExportModelColumn.CreatedAt]!: string;
    [DataExportModelColumn.ExpiredAt]!: string;
    [DataExportModelColumn.JobId]!: string;
    [DataExportModelColumn.ResultLink]!: Nullable<string>;
    [DataExportModelColumn.Error]!: Record<string, unknown>;
}
