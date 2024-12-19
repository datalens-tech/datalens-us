import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {makeSchemaValidator} from '../../components/validation-schema-compiler';
import {updateCollection} from '../../services/new/collection';
import {formatCollectionModel} from '../../services/new/collection/formatters';

export type UpdateCollectionReqBody = {
    title?: string;
    description?: string;
};

const validateBody = makeSchemaValidator({
    type: 'object',
    properties: {
        title: {
            type: 'string',
        },
        description: {
            type: 'string',
        },
    },
});

export type UpdateCollectionReqParams = {
    collectionId: string;
};

const validateParams = makeSchemaValidator({
    type: 'object',
    required: ['collectionId'],
    properties: {
        collectionId: {
            type: 'string',
        },
    },
});

export const updateCollectionController = async (req: Request, res: Response) => {
    const body = validateBody<UpdateCollectionReqBody>(req.body);
    const params = validateParams(req.params) as UpdateCollectionReqParams;

    const registry = req.ctx.get('registry');
    const {
        controllersCallbacks: {onUpdateCollectionError, onUpdateCollectionSuccess},
    } = registry.common.functions.get();

    try {
        const result = await updateCollection(
            {ctx: req.ctx},
            {
                collectionId: params.collectionId,
                title: body.title,
                description: body.description,
            },
        );

        onUpdateCollectionSuccess({
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            collection: result,
        });

        const formattedResponse = formatCollectionModel(result);

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

        res.status(code).send(response);
    } catch (error) {
        onUpdateCollectionError({
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            error,
        });

        throw error;
    }
};
