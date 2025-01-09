import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getCollectionsListByIds} from '../../services/new/collection';

import {collectionModelArray} from './response-models';

const requestSchema = {
    body: z.object({
        collectionIds: zc.encodedIdArray({min: 1, max: 1000}),
    }),
};

const parseBody = makeParser(requestSchema.body);

export const controller: AppRouteHandler = async (req, res) => {
    const body = await parseBody(req.body);

    const result = await getCollectionsListByIds(
        {ctx: req.ctx},
        {
            collectionIds: body.collectionIds,
        },
    );

    res.status(200).send(
        await collectionModelArray.format(result.map((instance) => instance.model)),
    );
};

controller.api = {
    summary: 'Get collections list by ids',
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
            description: collectionModelArray.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: collectionModelArray.schema,
                },
            },
        },
    },
};

controller.manualDecodeId = true;

export {controller as getCollectionsListByIds};
