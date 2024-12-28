import {Model} from '../../..';
import {Utils} from '../../../../../api/utils';

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

    $serialize() {
        return {
            ...this,
            dataExportId: Utils.encodeId(this.dataExportId),
            chartId: this.chartId && Utils.encodeId(this.chartId),
            chartRevId: this.chartRevId && Utils.encodeId(this.chartRevId),
            datasetId: this.datasetId && Utils.encodeId(this.datasetId),
            datasetRevId: this.datasetRevId && Utils.encodeId(this.datasetRevId),
            connectionId: this.connectionId && Utils.encodeId(this.connectionId),
            connectionRevId: this.connectionRevId && Utils.encodeId(this.connectionRevId),
        };
    }
}
