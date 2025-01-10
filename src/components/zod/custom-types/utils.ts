import {AppError} from '@gravity-ui/nodekit';

import US_ERRORS from '../../../const/us-error-constants';
import Utils from '../../../utils';

export const transformDecodedId = (val: string) => {
    try {
        return Utils.decodeId(val);
    } catch (err) {
        throw new AppError(`id '${val}' has incorrect format`, {
            code: US_ERRORS.DECODE_ID_FAILED,
        });
    }
};
