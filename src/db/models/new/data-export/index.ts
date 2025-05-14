import {Model} from '../../..';
import {Entry} from '../entry';

import {DataExportStatus} from './types';

export class DataExport extends Model {
    static get tableName() {
        return 'data_exports';
    }

    static get idColumn() {
        return 'dataExportId';
    }

    static get relationMappings() {
        return {
            chart: {
                relation: Model.BelongsToOneRelation,
                modelClass: Entry,
                join: {
                    from: `${DataExport.tableName}.chartId`,
                    to: `${Entry.tableName}.entryId`,
                },
            },
            dataset: {
                relation: Model.BelongsToOneRelation,
                modelClass: Entry,
                join: {
                    from: `${DataExport.tableName}.datasetId`,
                    to: `${Entry.tableName}.entryId`,
                },
            },
            connection: {
                relation: Model.BelongsToOneRelation,
                modelClass: Entry,
                join: {
                    from: `${DataExport.tableName}.connectionId`,
                    to: `${Entry.tableName}.entryId`,
                },
            },
        };
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
    expiredAt!: Nullable<string>;
    jobId!: string;
    s3Key!: Nullable<string>;
    uploadId!: Nullable<string>;
    error!: Nullable<Record<string, unknown>>;
    status!: DataExportStatus;
    size!: Nullable<string>;
    finishedAt!: Nullable<string>;
    cancelledBy!: Nullable<string>;
    cancelledAt!: Nullable<string>;

    chart?: Entry;
    dataset?: Entry;
    connection?: Entry;
}
