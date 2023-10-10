import FavoriteService from '../services/favorite.service';
import {Request, Response} from '@gravity-ui/expresskit';
import Utils from '../utils';
import prepareResponse from '../components/response-presenter';
import * as ST from '../types/services.types';
import Entry from '../db/models/entry';

export default {
    getFavorites: async (req: Request, res: Response) => {
        const query = req.query as unknown as ST.GetFavorite;

        const result = await FavoriteService.get({
            orderBy: query.orderBy,
            filters: query.filters,
            page: query.page && Number(query.page),
            pageSize: query.pageSize && Number(query.pageSize),
            scope: query.scope,
            includePermissionsInfo: Utils.isTrueArg(query.includePermissionsInfo),
            ignoreWorkbookEntries: Utils.isTrueArg(query.ignoreWorkbookEntries),
            ctx: req.ctx,
        });

        const {code, response} = prepareResponse({data: result});

        res.status(code).send(response);
    },
    addFavorite: async (req: Request, res: Response) => {
        const {params} = req;
        const entryId = params.entryId;

        const entry = await Entry.query(Entry.replica).select('tenantId').findById(entryId);

        if (!entry || entry.tenantId !== res.locals.tenantId) {
            res.status(404).send({error: 'Entry not found'});
            return;
        }

        const result = await FavoriteService.add({
            entryId,
            ctx: req.ctx,
        });

        const {code, response} = prepareResponse({data: result});

        res.status(code).send(response);
    },
    deleteFavorite: async (req: Request, res: Response) => {
        const {params} = req;
        const entryId = params.entryId;

        const entry = await Entry.query(Entry.replica).select('tenantId').findById(entryId);

        if (!entry || entry.tenantId !== res.locals.tenantId) {
            res.status(404).send({error: 'Entry not found'});
            return;
        }

        const result = await FavoriteService.delete({
            entryId: entryId,
            ctx: req.ctx,
        });

        const {code, response} = prepareResponse({data: result});

        res.status(code).send(response);
    },
};
