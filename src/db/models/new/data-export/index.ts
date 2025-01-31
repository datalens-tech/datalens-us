import {AppError} from '@gravity-ui/nodekit';

import {Model} from '../../..';
import {US_ERRORS} from '../../../../const';

export class DataExport extends Model {
    static createNotFoundError() {
        return new AppError(US_ERRORS.NOT_FOUND_DATA_EXPORT, {
            code: US_ERRORS.NOT_FOUND_DATA_EXPORT,
        });
    }

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
    s3Key!: Nullable<string>;
    uploadId!: Nullable<string>;
    error!: Nullable<Record<string, unknown>>;
}
