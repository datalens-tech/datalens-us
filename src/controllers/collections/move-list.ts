import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeValidator, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {moveCollectionsList} from '../../services/new/collection';

import {collectionModelArrayInObject} from './response-models';

const requestSchema = {
    body: z.object({
        collectionIds: zc.encodedIdArray({min: 1, max: 1000}),
        parentId: zc.encodedId().nullable(),
    }),
};

const validateBody = makeValidator(requestSchema.body);

export const moveList: AppRouteHandler = async (req, res) => {
    const body = validateBody(req.body);

    const result = await moveCollectionsList(
        {ctx: req.ctx},
        {
            collectionIds: body.collectionIds,
            parentId: body.parentId,
        },
    );

    res.status(200).send(await collectionModelArrayInObject.format(result));
};

moveList.api = {
    summary: 'Move collections list',
    tags: [ApiTag.Collections],
    request: {
        body: {
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: requestSchema.body,
                },
            },
        },
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

moveList.manualDecodeId = true;
