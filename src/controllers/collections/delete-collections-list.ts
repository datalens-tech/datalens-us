import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {deleteCollections} from '../../services/new/collection';

import {collectionModelArrayInObject} from './response-models';

const requestSchema = {
    body: z.object({
        collectionIds: zc.encodedIdArray({min: 1, max: 1000}),
    }),
};

const parseBody = makeParser(requestSchema.body);

export const controller: AppRouteHandler = async (req, res) => {
    const body = await parseBody(req.body);

    const result = await deleteCollections(
        {ctx: req.ctx},
        {
            collectionIds: body.collectionIds,
        },
    );

    res.status(200).send(await collectionModelArrayInObject.format(result));
};

controller.api = {
    summary: 'Delete collections list',
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

controller.manualDecodeId = true;

export {controller as deleteCollectionsList};
