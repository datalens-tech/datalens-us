import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {makeSchemaValidator} from '../../components/validation-schema-compiler';
import {createCollection} from '../../services/new/collection';
import {formatCollectionWithOperation} from '../../services/new/collection/formatters';

export type CreateCollectionReqBody = {
    title: string;
    description?: string;
    parentId: Nullable<string>;
};

const validateBody = makeSchemaValidator({
    type: 'object',
    required: ['title', 'parentId'],
    properties: {
        title: {
            type: 'string',
        },
        description: {
            type: 'string',
        },
        parentId: {
            type: ['string', 'null'],
        },
    },
});

export const createCollectionController = async (req: Request, res: Response) => {
    const body = validateBody<CreateCollectionReqBody>(req.body);

    const registry = req.ctx.get('registry');
    const {
        controllersCallbacks: {onCreateCollectionError, onCreateCollectionSuccess},
    } = registry.common.functions.get();

    try {
        const result = await createCollection(
            {ctx: req.ctx},
            {
                title: body.title,
                description: body.description,
                parentId: body.parentId,
            },
        );

        onCreateCollectionSuccess({
            ctx: req.ctx,
            reqBody: body,
            collection: result.collection.model,
        });

        const formattedResponse = formatCollectionWithOperation(
            result.collection,
            result.operation,
        );

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

        res.status(code).send(response);
    } catch (error) {
        onCreateCollectionError({ctx: req.ctx, reqBody: body, error});

        throw error;
    }
};
