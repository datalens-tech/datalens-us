import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {CollectionModel, CollectionModelColumn} from '../../../db/models/new/collection';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';

import {getCollection} from './';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['parentId', 'title'],
    properties: {
        parentId: {
            type: ['string', 'null'],
        },
        title: {
            type: 'string',
            verifyEntryName: true,
        },
    },
});

export interface CheckCollectionByTitleArgs {
    parentId: Nullable<string>;
    title: string;
}

export const checkCollectionByTitle = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: CheckCollectionByTitleArgs,
) => {
    const {parentId, title} = args;

    const {tenantId} = ctx.get('info');

    ctx.log('CHECK_COLLECTION_BY_TITLE_START', {
        parentId: Utils.encodeId(parentId),
        title,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const targetTrx = getReplica(trx);

    if (parentId) {
        await getCollection(
            {ctx, trx: targetTrx, skipValidation: true, skipCheckPermissions},
            {collectionId: parentId},
        );
    }

    const collection: Optional<CollectionModel> = await CollectionModel.query(targetTrx)
        .select()
        .where({
            [CollectionModelColumn.TenantId]: tenantId,
            [CollectionModelColumn.DeletedAt]: null,
            [CollectionModelColumn.ParentId]: parentId,
            [CollectionModelColumn.TitleLower]: title.toLowerCase(),
        })
        .first()
        .timeout(CollectionModel.DEFAULT_QUERY_TIMEOUT);

    const result = Boolean(collection);

    ctx.log('CHECK_COLLECTION_BY_TITLE_FINISH', {result});

    return result;
};
