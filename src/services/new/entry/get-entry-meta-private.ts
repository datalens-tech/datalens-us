import {AppError} from '@gravity-ui/nodekit';

import {US_ERRORS} from '../../../const';
import {DlsActions} from '../../../types/models';
import Utils from '../../../utils';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import {getWorkbook} from '../workbook';

import {getEntryMeta} from './get-entry-meta';

export type GetEntryMetaPrivateArgs = {
    entryId: string;
    masterToken: string;
    branch?: 'saved' | 'published';
};

export const getEntryMetaPrivate = async (
    {ctx, trx}: ServiceArgs,
    {entryId, masterToken, branch}: GetEntryMetaPrivateArgs,
) => {
    ctx.log('PRIVATE_GET_ENTRY_META_REQUEST', {
        entryId: Utils.encodeId(entryId),
    });

    const registry = ctx.get('registry');
    const {DLS} = registry.common.classes.get();

    const masterTokenReal = ctx.config.masterToken;

    if (!masterToken || !masterTokenReal || !masterTokenReal.includes(masterToken)) {
        throw new AppError(US_ERRORS.NOT_VALID_MASTER_TOKEN, {
            code: US_ERRORS.NOT_VALID_MASTER_TOKEN,
        });
    }

    const entryMeta = await getEntryMeta(
        {ctx, trx: getReplica(trx)},
        {
            entryId,
            branch,
        },
    );

    let statusCode: Optional<number>;

    if (entryMeta.workbookId) {
        try {
            await getWorkbook({ctx, trx}, {workbookId: entryMeta.workbookId});
        } catch (error) {
            const err = error as AppError;
            if (err.code === US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED) {
                statusCode = 403;
            } else {
                throw new AppError('PRIVATE_GET_ENTRY_META_FAILED', {
                    code: 'PRIVATE_GET_ENTRY_META_FAILED',
                });
            }
        }
    } else if (ctx.config.dlsEnabled) {
        try {
            await DLS.checkPermission(
                {ctx, trx},
                {
                    entryId,
                    action: DlsActions.Read,
                },
            );
        } catch (error) {
            const err = error as AppError;
            if (err.code === US_ERRORS.DLS_FORBIDDEN) {
                statusCode = 403;
            } else {
                throw new AppError('PRIVATE_GET_ENTRY_META_FAILED', {
                    code: 'PRIVATE_GET_ENTRY_META_FAILED',
                });
            }
        }
    }

    ctx.log('PRIVATE_GET_ENTRY_META_SUCCESS');

    return {entryMeta, statusCode};
};
