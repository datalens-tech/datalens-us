import {raw} from 'objection';

import {
    DEFAULT_QUERY_TIMEOUT,
    EXTENDED_QUERY_TIMEOUT,
    RETURN_RELATION_COLUMNS,
} from '../../../const';
import Entry from '../../../db/models/entry';
import {EntryScope} from '../../../db/models/new/entry/types';
import {ServiceArgs} from '../../new/types';
import {getReplica} from '../../new/utils';

export enum RelationDirection {
    Parent = 'parent',
    Child = 'child',
}

type GetRelatedEntriesData = {
    entryIds: string[];
    direction?: RelationDirection;
    extendedTimeout?: boolean;
    scope?: EntryScope;
    page?: number;
    pageSize?: number;
};

type GetRelatedEntriesResult = {
    entryId: string;
    key: string;
    scope: EntryScope;
    type: string;
    createdAt: string;
    meta: Record<string, unknown>;
    public: boolean;
    tenantId: string;
    workbookId: string | null;
    depth: number;
};

export async function getRelatedEntries(
    {ctx, trx}: ServiceArgs,
    {
        entryIds,
        direction = RelationDirection.Parent,
        scope,
        page,
        pageSize,
        extendedTimeout = false,
    }: GetRelatedEntriesData,
) {
    ctx.log('GET_RELATED_ENTRIES_RUN', {scope, page, pageSize});

    const endToStart = direction === RelationDirection.Parent;

    const relatedEntryIdsQuery = Entry.query(getReplica(trx))
        .withRecursive('relatedEntries', (qb) => {
            qb.select(['fromId', 'toId', raw('1 depth')])
                .from('links')
                .join('entries', 'entries.entryId', endToStart ? 'links.toId' : 'links.fromId')
                .where({isDeleted: false})
                .whereIn(endToStart ? 'links.fromId' : 'links.toId', entryIds)
                .union((qbx) => {
                    qbx.select(['l.fromId', 'l.toId', raw('depth + 1')])
                        .from('links as l')
                        .join(
                            'relatedEntries',
                            endToStart ? 'relatedEntries.toId' : 'relatedEntries.fromId',
                            endToStart ? 'l.fromId' : 'l.toId',
                        )
                        .join('entries', 'entries.entryId', endToStart ? 'l.toId' : 'l.fromId')
                        .where((builder) => {
                            builder.where({isDeleted: false});

                            builder.andWhere('depth', '<', 5);

                            if (scope) {
                                builder.andWhere('entries.scope', scope);
                            }
                        });
                });
        })
        .select([{entryId: endToStart ? 'toId' : 'fromId'}, 'depth'])
        .from('relatedEntries');

    const relatedEntryIds = await relatedEntryIdsQuery.timeout(
        extendedTimeout ? EXTENDED_QUERY_TIMEOUT : DEFAULT_QUERY_TIMEOUT,
    );

    const depthMap = new Map<string, number>();
    for (const row of relatedEntryIds as unknown as {entryId: string; depth: number}[]) {
        if (depthMap.has(row.entryId)) {
            depthMap.set(row.entryId, Math.min(depthMap.get(row.entryId)!, row.depth));
        } else {
            depthMap.set(row.entryId, row.depth);
        }
    }

    const entryIdList = Array.from(depthMap.keys());

    if (entryIdList.length === 0) {
        ctx.log('GET_RELATED_ENTRIES_DONE', {amount: 0});
        return [];
    }

    const relatedEntriesQuery = Entry.query(getReplica(trx))
        .select([...RETURN_RELATION_COLUMNS, 'entries.created_at'])
        .join('revisions', 'entries.savedId', 'revisions.revId')
        .whereIn('entries.entryId', entryIdList)
        .orderBy('entries.createdAt');

    if (scope) {
        relatedEntriesQuery.where('entries.scope', scope);
    }

    if (pageSize) {
        relatedEntriesQuery.limit(pageSize);
        if (page) {
            relatedEntriesQuery.offset(pageSize * page);
        }
    }

    const baseResult = await relatedEntriesQuery.timeout(
        extendedTimeout ? EXTENDED_QUERY_TIMEOUT : DEFAULT_QUERY_TIMEOUT,
    );

    const result: GetRelatedEntriesResult[] = baseResult.map((entry) => ({
        ...(entry as unknown as GetRelatedEntriesResult),
        depth: depthMap.get(entry.entryId) ?? 1,
    }));

    ctx.log('GET_RELATED_ENTRIES_DONE', {amount: result?.length});

    return result;
}
