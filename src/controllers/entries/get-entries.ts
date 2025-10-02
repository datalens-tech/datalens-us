import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {makeReqParser, z, zc} from '../../components/zod';
import {EntryScope} from '../../db/models/new/entry/types';
import NavigationService from '../../services/navigation.service';
import {formatGetEntriesResponse} from '../../services/new/entry/formatters';
import {isTrueArg} from '../../utils/env-utils';

const idsSchema = z
    .union([z.string(), z.array(z.unknown())])
    .transform((value) => {
        if (typeof value === 'string') {
            return [value];
        }

        return value;
    })
    .pipe(zc.encodedIdArraySafe({min: 0, max: 1000}));

const orderBySchema = z.object({
    field: z.enum(['createdAt', 'name']),
    direction: z.enum(['asc', 'desc']),
});

const filtersSchema = z.object({
    name: z.string().optional(),
});

const requestSchema = {
    query: z
        .object({
            ids: idsSchema.optional(),
            scope: z.nativeEnum(EntryScope).optional(),
            type: z.string().optional(),
            createdBy: z.union([z.string(), z.array(z.string())]).optional(),
            orderBy: orderBySchema.optional(),
            meta: z.record(z.union([z.string(), z.array(z.string())])).optional(),
            filters: filtersSchema.optional(),
            page: zc.stringNumber({min: 0}).optional(),
            pageSize: zc.stringNumber({min: 1, max: 200}).optional(),
            includePermissionsInfo: zc.stringBoolean().optional(),
            ignoreWorkbookEntries: zc.stringBoolean().optional(),
            ignoreSharedEntries: zc.stringBoolean().optional(),
            includeData: zc.stringBoolean().optional(),
            includeLinks: zc.stringBoolean().optional(),
            excludeLocked: zc.stringBoolean().optional(),
        })
        .refine((data) => data.ids || data.scope, {
            message: 'Either "ids" or "scope" must be provided.',
        }),
};

const parseReq = makeReqParser(requestSchema);

export const getEntriesController = async (req: Request, res: Response) => {
    const {query} = await parseReq(req);

    const result = await NavigationService.getEntries({
        ids: query.ids?.decoded,
        scope: query.scope,
        type: query.type,
        createdBy: query.createdBy,
        orderBy: query.orderBy,
        meta: query.meta,
        filters: query.filters,
        page: query.page,
        pageSize: query.pageSize,
        includePermissionsInfo: isTrueArg(query.includePermissionsInfo),
        ignoreWorkbookEntries: isTrueArg(query.ignoreWorkbookEntries),
        ignoreSharedEntries: isTrueArg(query.ignoreSharedEntries),
        includeData: isTrueArg(query.includeData),
        includeLinks: isTrueArg(query.includeLinks),
        excludeLocked: isTrueArg(query.excludeLocked),
        ctx: req.ctx,
    });

    const formattedResponse = formatGetEntriesResponse(req.ctx, result);

    const {code, response} = await prepareResponseAsync({data: formattedResponse});

    res.status(code).send(response);
};

getEntriesController.manualDecodeId = true;
