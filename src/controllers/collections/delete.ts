import {Request, Response} from 'express';

import {prepareResponseAsync} from '../../components/response-presenter';
import {makeSchemaValidator} from '../../components/validation-schema-compiler';
import {deleteCollections} from '../../services/new/collection';
import {formatCollectionModelsList} from '../../services/new/collection/formatters';

export type DeleteCollectionReqParams = {
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

export const deleteCollectionController = async (req: Request, res: Response) => {
    const params = validateParams(req.params) as DeleteCollectionReqParams;

    const registry = req.ctx.get('registry');
    const {
        controllersCallbacks: {onDeleteCollectionError, onDeleteCollectionSuccess},
    } = registry.common.functions.get();

    try {
        const result = await deleteCollections(
            {ctx: req.ctx},
            {
                collectionIds: [params.collectionId],
            },
        );

        onDeleteCollectionSuccess({
            ctx: req.ctx,
            reqParams: params,
            collections: result.collections,
        });

        const formattedResponse = formatCollectionModelsList(result);

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

        res.status(code).send(response);
    } catch (error) {
        onDeleteCollectionError({ctx: req.ctx, reqParams: params, error});

        throw error;
    }
};
