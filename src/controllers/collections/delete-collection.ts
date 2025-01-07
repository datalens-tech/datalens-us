import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeValidator, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {deleteCollections} from '../../services/new/collection';

import {collectionModelArrayInObject} from './response-models';

const requestSchema = {
    params: z.object({
        collectionId: zc.encodedId(),
    }),
};

const validateParams = makeValidator(requestSchema.params);

export const deleteCollection: AppRouteHandler = async (req, res) => {
    const params = validateParams(req.params);

    const result = await deleteCollections(
        {ctx: req.ctx},
        {
            collectionIds: [params.collectionId],
        },
    );

    res.status(200).send(await collectionModelArrayInObject.format(result));
};

deleteCollection.api = {
    summary: 'Delete collection',
    tags: [ApiTag.Collections],
    request: {
        params: requestSchema.params,
    },
    responses: {
        200: {
            description: collectionModelArrayInObject.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: collectionModelArrayInObject.schema,
                },
            },
        },
    },
};

deleteCollection.manualDecodeId = true;
