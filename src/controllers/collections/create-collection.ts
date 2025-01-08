import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeValidator, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {createCollection} from '../../services/new/collection';

import {collectionInstanceWithOperation} from './response-models';

const requestSchema = {
    body: z.object({
        title: z.string(),
        description: z.string().optional(),
        parentId: zc.encodedId().nullable(),
    }),
};

const validateBody = makeValidator(requestSchema.body);

const controller: AppRouteHandler = async (req, res) => {
    const body = validateBody(req.body);

    const result = await createCollection(
        {ctx: req.ctx},
        {
            title: body.title,
            description: body.description,
            parentId: body.parentId,
        },
    );

    res.status(200).send(
        collectionInstanceWithOperation.format(result.collection, result.operation),
    );
};

controller.api = {
    summary: 'Create collection',
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
            description: collectionInstanceWithOperation.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: collectionInstanceWithOperation.schema.omit({permissions: true}),
                },
            },
        },
    },
};

controller.manualDecodeId = true;

export {controller as createCollection};
