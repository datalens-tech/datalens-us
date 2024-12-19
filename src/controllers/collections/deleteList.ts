import {Request, Response} from 'express';

import {prepareResponseAsync} from '../../components/response-presenter';
import {makeSchemaValidator} from '../../components/validation-schema-compiler';
import {deleteCollections} from '../../services/new/collection';
import {formatCollectionModelsList} from '../../services/new/collection/formatters';

export type DeleteCollectionsListReqBody = {
    collectionIds: string[];
};

const validateBody = makeSchemaValidator({
    type: 'object',
    required: ['collectionIds'],
    properties: {
        collectionIds: {
            type: 'array',
            items: {type: 'string'},
        },
    },
});

export const deleteListController = async (req: Request, res: Response) => {
    const body = validateBody<DeleteCollectionsListReqBody>(req.body);

    const registry = req.ctx.get('registry');
    const {
        controllersCallbacks: {onDeleteCollectionsListError, onDeleteCollectionsListSuccess},
    } = registry.common.functions.get();

    try {
        const result = await deleteCollections(
            {ctx: req.ctx},
            {
                collectionIds: body.collectionIds,
            },
        );

        onDeleteCollectionsListSuccess({
            ctx: req.ctx,
            reqBody: body,
            collections: result.collections,
        });

        const formattedResponse = formatCollectionModelsList(result);

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

        res.status(code).send(response);
    } catch (error) {
        onDeleteCollectionsListError({
            ctx: req.ctx,
            reqBody: body,
            error,
        });

        throw error;
    }
};
