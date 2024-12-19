import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../components/response-presenter';
import {getRootCollectionPermissions} from '../../services/new/collection';

export const getRootCollectionPermissionsController = async (req: Request, res: Response) => {
    const result = await getRootCollectionPermissions({ctx: req.ctx});

    const {code, response} = await prepareResponseAsync({data: result});

    res.status(code).send(response);
};
