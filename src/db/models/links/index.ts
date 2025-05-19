import {AppError} from '@gravity-ui/nodekit';
import {TransactionOrKnex} from 'objection';

import {Model} from '../..';
import {US_ERRORS} from '../../../const';
import * as MT from '../../../types/models';
import Utils from '../../../utils';
import Entry from '../entry';

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

            let dbLinks;

            try {
                dbLinks = Links.produceDbLinks(entryId, links);
            } catch (error) {
                throw new AppError('Failed to decode link ID', {
                    code: US_ERRORS.DECODE_ID_FAILED,
                });
            }

            if (!dbLinks.length) {
                return null;
            }

            const targetEntryIds = dbLinks.map((link) => link.toId).filter(Boolean);

            if (targetEntryIds.length) {
                const {tenantId} = ctx.get('info');

                await Links.validateTargetEntriesExist(
                    targetEntryIds,
                    dbLinks,
                    tenantId,
                    trxOverride,
                );
            }

            ctx.log('DB_LINKS', {dbLinks});

            await Links.query(trxOverride).where({fromId: entryId}).delete();

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

    private static produceDbLinks(entryId: string, links: {}) {
        return Object.entries(links).map(([name, toId]) => ({
            fromId: entryId,
            toId: Utils.decodeId(toId as string),
            name,
        }));
    }

    private static async validateTargetEntriesExist(
        targetEntryIds: string[],
        dbLinks: Array<{fromId: string; toId: string; name: string}>,
        tenantId: string,
        trx: TransactionOrKnex,
    ): Promise<void> {
        const existingEntries = await Entry.query(trx)
            .select('entryId')
            .whereIn('entryId', targetEntryIds)
            .where('tenantId', tenantId);

        const existingEntryIdsSet = new Set(existingEntries.map((entry) => entry.entryId));
        const linksByToId = new Map(dbLinks.map((link) => [link.toId, link]));

        const nonExistentEntryIds = targetEntryIds.filter((id) => !existingEntryIdsSet.has(id));

        if (nonExistentEntryIds.length === 0) {
            return;
        }

        const invalidLinks = await Utils.macrotasksMap(nonExistentEntryIds, (id) => {
            const link = linksByToId.get(id);
            return {
                name: link?.name || 'unknown',
                id: Utils.encodeId(id),
            };
        });

        throw new AppError('Some referenced entries do not exist', {
            code: US_ERRORS.VALIDATION_ERROR,
            details: {
                invalidLinks,
                totalLinks: dbLinks.length,
                missingCount: nonExistentEntryIds.length,
            },
        });
    }
}

export default Links;
