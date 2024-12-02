import {AppError} from '@gravity-ui/nodekit';

import {Model} from '../..';
import {US_ERRORS} from '../../../const';
import * as MT from '../../../types/models';
import Utils from '../../../utils';

import {validateCreateLink} from './scheme';

interface Links extends MT.LinksColumns {}
class Links extends Model {
    static get tableName() {
        return 'links';
    }

    static get idColumn() {
        return ['fromId', 'toId'];
    }

    static async sync({entryId, links, ctx, trxOverride}: MT.SyncConf) {
        try {
            ctx.log('SYNC_LINKS_REQUEST', {entryId, links});

            const {isValid, validationErrors} = validateCreateLink({entryId, links});

            if (!isValid) {
                throw new AppError('Validation error', {
                    code: US_ERRORS.VALIDATION_ERROR,
                    details: {validationErrors},
                });
            }

            const dbLinks = Links.produceDbLinks(entryId, links);

            ctx.log('DB_LINKS', {dbLinks});

            await Links.query(trxOverride).where({fromId: entryId}).delete();

            if (!dbLinks.length) {
                return null;
            }

            const result = await Links.query(trxOverride).upsertGraph(dbLinks, {
                insertMissing: true,
            });

            ctx.log('SYNC_LINKS_SUCCESS');

            return result;
        } catch (error) {
            ctx.logError('SYNC_LINKS_FAILED', error);

            throw new AppError('SYNC_LINKS_FAILED', {
                code: 'SYNC_LINKS_FAILED',
            });
        }
    }

    private static produceDbLinks(entryId: string, links: {}) {
        return Object.entries(links).map(([name, toId]) => ({
            fromId: entryId,
            toId: Utils.decodeId(toId as string),
            name,
        }));
    }
}

export default Links;
