import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import Utils from '../../../utils';
import {getCollection} from '../collection';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['collectionId', 'title'],
    properties: {
        collectionId: {
            type: ['string', 'null'],
        },
        title: {
            type: 'string',
        },
    },
});

export interface CheckWorkbookByTitleArgs {
    collectionId: Nullable<string>;
    title: string;
}

export const checkWorkbookByTitle = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: CheckWorkbookByTitleArgs,
) => {
    const {collectionId, title} = args;

    ctx.log('CHECK_WORKBOOK_BY_TITLE_START', {
        collectionId: collectionId ? Utils.encodeId(collectionId) : null,
        title,
    });

    const {tenantId, projectId} = ctx.get('info');

    if (!skipValidation) {
        validateArgs(args);
    }

    const targetTrx = getReplica(trx);

    if (collectionId) {
        await getCollection(
            {ctx, trx: targetTrx, skipValidation: true, skipCheckPermissions},
            {collectionId},
        );
    }

    const workbook: Optional<WorkbookModel> = await WorkbookModel.query(targetTrx)
        .select()
        .where({
            [WorkbookModelColumn.TenantId]: tenantId,
            [WorkbookModelColumn.ProjectId]: projectId,
            [WorkbookModelColumn.DeletedAt]: null,
            [WorkbookModelColumn.CollectionId]: collectionId,
            [WorkbookModelColumn.TitleLower]: title.toLowerCase(),
        })
        .first()
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    const result = Boolean(workbook);

    ctx.log('CHECK_WORKBOOK_BY_TITLE_FINISH', {result});

    return result;
};
