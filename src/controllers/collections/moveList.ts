import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {makeSchemaValidator} from '../../components/validation-schema-compiler';
import {moveCollectionsList} from '../../services/new/collection';
import {formatCollectionModelsList} from '../../services/new/collection/formatters';

export type MoveCollectionsListReqBody = {
    collectionIds: string[];
    parentId: Nullable<string>;
};

const validateBody = makeSchemaValidator({
    type: 'object',
    required: ['collectionIds', 'parentId'],
    properties: {
        collectionIds: {
            type: 'array',
            items: {type: 'string'},
        },
        parentId: {
            type: ['string', 'null'],
        },
    },
});

export const moveCollectionsListController = async (req: Request, res: Response) => {
    const body = validateBody<MoveCollectionsListReqBody>(req.body);

    const registry = req.ctx.get('registry');
    const {
        controllersCallbacks: {onMoveCollectionsListError, onMoveCollectionsListSuccess},
    } = registry.common.functions.get();

    try {
        const result = await moveCollectionsList(
            {ctx: req.ctx},
            {
                collectionIds: body.collectionIds,
                parentId: body.parentId,
            },
        );

        onMoveCollectionsListSuccess({
            ctx: req.ctx,
            reqBody: body,
            collections: result.collections,
        });

        const formattedResponse = formatCollectionModelsList(result);

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

        res.status(code).send(response);
    } catch (error) {
        onMoveCollectionsListError({
            ctx: req.ctx,
            reqBody: body,
            error,
        });

        throw error;
    }
};
