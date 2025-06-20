import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import Entry from '../../db/models/entry';
import FavoriteService from '../../services/favorite.service';

import {favoriteInstanceModel} from './response-models/favorite-instance-model';

const requestSchema = {
    params: z.object({
        entryId: zc.encodedId(),
    }),
};
const parseReq = makeReqParser(requestSchema);

export const deleteFavoriteController: AppRouteHandler = async (req, res) => {
    const {params} = await parseReq(req);
    const {entryId} = params;

    const entry = await Entry.query(Entry.replica).select('tenantId').findById(entryId);

    if (!entry || entry.tenantId !== res.locals.tenantId) {
        res.status(404).send({error: 'Entry not found'});
        return;
    }

    const result = await FavoriteService.delete({
        entryId,
        ctx: req.ctx,
    });

    res.status(200).send([favoriteInstanceModel.format(result[0])]);
};

deleteFavoriteController.api = {
    tags: [ApiTag.Favorites],
    summary: 'Delete entry from favorites',
    request: {
        params: requestSchema.params,
    },
    responses: {
        200: {
            description: favoriteInstanceModel.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: favoriteInstanceModel.schema,
                },
            },
        },
    },
};
deleteFavoriteController.manualDecodeId = true;
