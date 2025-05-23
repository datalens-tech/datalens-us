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

            const dbLinks = await Links.produceDbLinks(entryId, links);

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

            if (AppError.isAppError(error)) {
                throw error;
            }

            throw new AppError('SYNC_LINKS_FAILED', {
                code: 'SYNC_LINKS_FAILED',
            });
        }
    }

    private static async produceDbLinks(entryId: string, links: {}) {
        const linkEntries = Object.entries(links);
        const invalidLinkIds: Record<string, string> = {};
        const validLinks: {fromId: string; toId: string; name: string}[] = [];

        await Utils.macrotasksMap(linkEntries, ([name, toId]) => {
            try {
                const decodedId = Utils.decodeId(toId as string);
                validLinks.push({
                    fromId: entryId,
                    toId: decodedId,
                    name,
                });
            } catch (error) {
                invalidLinkIds[name] = toId as string;
            }
        });

        if (Object.keys(invalidLinkIds).length > 0) {
            throw new AppError(US_ERRORS.INCORRECT_LINK_ERROR, {
                code: US_ERRORS.INCORRECT_LINK_ERROR,
                details: {invalidLinkIds},
            });
        }

        return validLinks;
    }
}

export default Links;
