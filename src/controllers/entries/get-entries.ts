import {withContract} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {z, zc} from '../../components/zod';
import {EntryScope} from '../../db/models/new/entry/types';
import NavigationService, {GetEntriesResult} from '../../services/navigation.service';

import {getEntriesModel} from './response-models/get-entries-model';

const idsSchema = zc.queryArray().pipe(zc.encodedIdArraySafe({min: 0, max: 1000}));

const orderBySchema = z.object({
    field: z.enum(['createdAt', 'name']),
    direction: zc.orderDirection(),
});

const filtersSchema = z.object({
    name: z.string().optional(),
});

const idsOrScopeRefine = (data: {ids?: unknown; scope?: unknown}) =>
    Boolean(data.ids || data.scope);
const idsOrScopeRefineOptions = {error: 'Either "ids" or "scope" must be provided.'};

const requestSchema = {
    query: z
        .object({
            ids: idsSchema.optional(),
            scope: z.enum(EntryScope).optional(),
            type: zc.queryArray({min: 1, max: 10}).optional(),
            createdBy: z.union([z.string(), z.array(z.string())]).optional(),
            orderBy: orderBySchema.optional(),
            meta: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
            filters: filtersSchema.optional(),
            pageSize: zc.stringNumber({min: 1, max: 200}).optional(),
            includePermissionsInfo: zc.stringBoolean().optional(),
            ignoreWorkbookEntries: zc.stringBoolean().optional(),
            ignoreSharedEntries: zc.stringBoolean().optional(),
            includeData: zc.stringBoolean().optional(),
            includeLinks: zc.stringBoolean().optional(),
            excludeLocked: zc.stringBoolean().optional(),
            page: zc.stringNumber({min: 0}).optional(),
        })
        .refine(idsOrScopeRefine, idsOrScopeRefineOptions),
};

/** @deprecated use getEntriesV2Controller */
export const getEntriesController = withContract({
    operationId: 'getEntries',
    summary: 'Get entries',
    tags: [ApiTag.Entries],
    deprecated: true,
    request: {
        query: requestSchema.query,
    },
    response: {
        content: {
            200: {
                schema: getEntriesModel.schema,
                description: getEntriesModel.schema.description,
            },
        },
    },
})(async (req, res) => {
    const {
        ids,
        scope,
        type,
        createdBy,
        orderBy,
        meta,
        filters,
        page,
        pageSize,
        includePermissionsInfo,
        ignoreWorkbookEntries,
        ignoreSharedEntries,
        includeData,
        includeLinks,
        excludeLocked,
    } = req.query;

    const {privatePermissions} = req.ctx.get('info');

    const result = await NavigationService.getEntries({
        ids: ids?.decoded,
        scope,
        types: type,
        createdBy,
        orderBy,
        meta,
        filters,
        paginationMode: 'offset',
        page,
        pageSize,
        includePermissionsInfo,
        ignoreWorkbookEntries,
        ignoreSharedEntries,
        includeData,
        includeLinks,
        excludeLocked,
        ctx: req.ctx,
    });

    res.sendTyped(
        200,
        await getEntriesModel.format(result as GetEntriesResult, privatePermissions),
    );
});

getEntriesController.manualDecodeId = true;

const requestV2Schema = {
    body: z
        .object({
            ids: zc.encodedIdArraySafe({min: 0, max: 1000}).optional(),
            scope: z.enum(EntryScope).optional(),
            type: z.union([z.string(), z.array(z.string()).min(1).max(10)]).optional(),
            createdBy: z.array(z.string()).max(1000).optional(),
            orderBy: orderBySchema.optional(),
            meta: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
            filters: filtersSchema.optional(),
            pageSize: z.number().int().min(1).max(200).optional(),
            includePermissionsInfo: z.boolean().optional(),
            ignoreWorkbookEntries: z.boolean().optional(),
            ignoreSharedEntries: z.boolean().optional(),
            includeData: z.boolean().optional(),
            includeLinks: z.boolean().optional(),
            excludeLocked: z.boolean().optional(),
            pageToken: z.string().optional(),
        })
        .refine(idsOrScopeRefine, idsOrScopeRefineOptions),
};

export const getEntriesV2Controller = withContract({
    operationId: 'getEntriesV2',
    summary: 'Get entries',
    tags: [ApiTag.Entries],
    request: {
        body: requestV2Schema.body,
    },
    response: {
        content: {
            200: {
                schema: getEntriesModel.schema,
                description: getEntriesModel.schema.description,
            },
        },
    },
})(async (req, res) => {
    const {
        ids,
        scope,
        type,
        createdBy,
        orderBy,
        meta,
        filters,
        pageToken,
        pageSize,
        includePermissionsInfo,
        ignoreWorkbookEntries,
        ignoreSharedEntries,
        includeData,
        includeLinks,
        excludeLocked,
    } = req.body;

    const {privatePermissions} = req.ctx.get('info');

    const result = await NavigationService.getEntries({
        ids: ids?.decoded,
        scope,
        types: type === undefined ? undefined : [type].flat(),
        createdBy,
        orderBy,
        meta,
        filters,
        paginationMode: 'cursor',
        pageToken,
        pageSize,
        includePermissionsInfo,
        ignoreWorkbookEntries,
        ignoreSharedEntries,
        includeData,
        includeLinks,
        excludeLocked,
        ctx: req.ctx,
    });

    res.sendTyped(
        200,
        await getEntriesModel.format(result as GetEntriesResult, privatePermissions),
    );
});

getEntriesV2Controller.manualDecodeId = true;
