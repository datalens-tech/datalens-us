import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {getTenant} from '../../services/new/tenants';

import {tenantModel} from './response-models';

export const requestSchema = {
    params: z.object({
        tenantId: z.string(),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const getTenantDetailsByIdController: AppRouteHandler = async (req, res) => {
    const {params} = await parseReq(req);

    const result = await getTenant({ctx: req.ctx}, {tenantId: params.tenantId});

    res.status(200).send(tenantModel.format(result));
};

getTenantDetailsByIdController.api = {
    summary: 'Get tenant details by id',
    tags: [ApiTag.Tenants],
    request: {
        params: requestSchema.params,
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

getTenantDetailsByIdController.manualDecodeId = true;
