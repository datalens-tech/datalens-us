import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../../const';
import {
    EntityBindingModel,
    EntityBindingModelColumn,
} from '../../../../db/models/new/entity-binding';
import {ServiceArgs} from '../../types';
import {getReplica} from '../../utils';

type PartialEntry = {
    entryId: string;
    workbookId: string | null;
    collectionId: string | null;
};

type CheckWorkbookIsolationArgs = {
    entry: PartialEntry;
    getEntityBindingsQueryTimeout?: number;
};

export const checkWorkbookIsolation = async (
    {ctx, trx}: ServiceArgs,
    {
        entry,
        getEntityBindingsQueryTimeout = EntityBindingModel.DEFAULT_QUERY_TIMEOUT,
    }: CheckWorkbookIsolationArgs,
) => {
    const {workbookId: requestWorkbookId, datasetId: requestDatasetId} = ctx.get('info');

    if (!requestWorkbookId) {
        return;
    }

    if (entry.collectionId) {
        const sourceIds = [entry.entryId];
        if (requestDatasetId) {
            sourceIds.push(requestDatasetId);
        }
        const entityBindings = await EntityBindingModel.query(getReplica(trx))
            .select([EntityBindingModelColumn.SourceId, EntityBindingModelColumn.TargetId])
            .where(EntityBindingModelColumn.TargetId, requestWorkbookId)
            .whereIn(EntityBindingModelColumn.SourceId, sourceIds)
            .timeout(getEntityBindingsQueryTimeout);

        if (entityBindings.length === 0) {
            throw new AppError(US_ERRORS.WORKBOOK_ISOLATION_INTERRUPTION, {
                code: US_ERRORS.WORKBOOK_ISOLATION_INTERRUPTION,
            });
        }
        return;
    }

    if (requestWorkbookId !== entry.workbookId) {
        throw new AppError(US_ERRORS.WORKBOOK_ISOLATION_INTERRUPTION, {
            code: US_ERRORS.WORKBOOK_ISOLATION_INTERRUPTION,
        });
    }
};
