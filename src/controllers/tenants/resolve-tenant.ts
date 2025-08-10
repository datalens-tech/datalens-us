import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {resolveTenant} from '../../services/new/tenants';

import {tenantModel} from './response-models';

export const requestSchema = {
    query: z
        .object({
            entryId: zc.encodedId().optional(),
            collectionId: zc.encodedId().optional(),
            workbookId: zc.encodedId().optional(),
        })
        .superRefine((val, ctx) => {
            if (!(val.entryId || val.collectionId || val.workbookId)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [],
                    message: "Either 'entryId', 'collectionId' or 'workbookId' must be set",
                });
            }

            const settedValues = [
                Boolean(val.entryId),
                Boolean(val.collectionId),
                Boolean(val.workbookId),
            ].filter((item) => item);

            if (settedValues.length > 1) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [],
                    message:
                        "Either 'entryId', 'collectionId' or 'workbookId' must be set, but no more than one",
                });
            }
        }),
};

const parseReq = makeReqParser(requestSchema);

export const resolveTenantController: AppRouteHandler = async (req, res) => {
    const {query} = await parseReq(req);

    const result = await resolveTenant(
        {ctx: req.ctx},
        {entryId: query.entryId, collectionId: query.collectionId, workbookId: query.workbookId},
    );

    res.status(200).send(tenantModel.format(result));
};

resolveTenantController.api = {
    summary: 'Resolve tenant',
    tags: [ApiTag.Tenants],
    request: {
        query: requestSchema.query,
    },
    responses: {
        200: {
            description: `${tenantModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: tenantModel.schema,
                },
            },
        },
    },
};

resolveTenantController.manualDecodeId = true;
