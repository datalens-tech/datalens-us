import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {CONTENT_TYPE_JSON} from '../../const';
import {getRootCollectionPermissions} from '../../services/new/collection';

import {rootPermissions} from './response-models';

export const controller: AppRouteHandler = async (req, res) => {
    const result = await getRootCollectionPermissions({ctx: req.ctx});
    res.status(200).send(rootPermissions.format(result));
};

controller.api = {
    summary: 'Get root permissions',
    tags: [ApiTag.Collections],
    responses: {
        200: {
            description: rootPermissions.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: rootPermissions.schema,
                },
            },
        },
    },
};

export {controller as getRootPermissions};
