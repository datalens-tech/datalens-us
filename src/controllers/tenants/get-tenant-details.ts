import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {CONTENT_TYPE_JSON} from '../../const';
import {getTenant} from '../../services/new/tenants';

import {tenantModel} from './response-models';

export const getTenantDetailsController: AppRouteHandler = async (req, res) => {
    const {tenantId} = req.ctx.get('info');

    const result = await getTenant({ctx: req.ctx}, {tenantId});

    res.status(200).send(tenantModel.format(result));
};

getTenantDetailsController.api = {
    summary: 'Get tenant details',
    tags: [ApiTag.Tenants],
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

getTenantDetailsController.manualDecodeId = true;
