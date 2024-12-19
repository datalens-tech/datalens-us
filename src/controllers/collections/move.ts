import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {makeSchemaValidator} from '../../components/validation-schema-compiler';
import {moveCollection} from '../../services/new/collection';
import {formatCollectionModel} from '../../services/new/collection/formatters';

export type MoveCollectionReqBody = {
    parentId: Nullable<string>;
    title?: string;
};

const validateBody = makeSchemaValidator({
    type: 'object',
    required: ['parentId'],
    properties: {
        parentId: {
            type: ['string', 'null'],
        },
        title: {
            type: 'string',
        },
    },
});

export type MoveCollectionReqParams = {
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

export const moveCollectionController = async (req: Request, res: Response) => {
    const body = validateBody<MoveCollectionReqBody>(req.body);
    const params = validateParams(req.params) as MoveCollectionReqParams;

    const registry = req.ctx.get('registry');
    const {
        controllersCallbacks: {onMoveCollectionError, onMoveCollectionSuccess},
    } = registry.common.functions.get();

    try {
        const result = await moveCollection(
            {ctx: req.ctx},
            {
                collectionId: params.collectionId,
                parentId: body.parentId,
                title: body.title,
            },
        );

        onMoveCollectionSuccess({
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            collection: result,
        });

        const formattedResponse = formatCollectionModel(result);

        const {code, response} = await prepareResponseAsync({data: formattedResponse});

        res.status(code).send(response);
    } catch (error) {
        onMoveCollectionError({
            ctx: req.ctx,
            reqBody: body,
            reqParams: params,
            error,
        });

        throw error;
    }
};
