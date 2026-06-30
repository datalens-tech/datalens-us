import {PrivateClientScopeForbiddenError} from '../../../../components/errors';
import {EntryScope} from '../../../../db/models/new/entry/types';
import {ServiceArgs} from '../../types';

export const checkPrivateScopeAccess = ({ctx}: ServiceArgs, scope: string) => {
    const {privateRestrictions} = ctx.get('info');

    if (
        privateRestrictions &&
        !privateRestrictions.allowedEntryScopes?.includes(scope as EntryScope)
    ) {
        throw new PrivateClientScopeForbiddenError();
    }
};
