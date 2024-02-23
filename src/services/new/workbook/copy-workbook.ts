import {TransactionOrKnex, transaction} from 'objection';
import {AppError, AppContext} from '@gravity-ui/nodekit';
import {getParentIds} from '../collection/utils/get-parents';
import {ServiceArgs} from '../types';
import {getPrimary, getReplica} from '../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {US_ERRORS} from '../../../const';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {JoinedEntryRevisionColumns} from '../../../db/presentations/joined-entry-revision';
import {RevisionModel} from '../../../db/models/new/revision';
import Link from '../../../db/models/links';
import {Entry} from '../../../db/models/new/entry';
import {WorkbookPermission} from '../../../entities/workbook';
import Utils, {logInfo} from '../../../utils';
import {copyToWorkbook} from '../../entry/actions';
import {getCollection} from '../collection';
import {registry} from '../../../registry';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['workbookId', 'collectionId', 'title'],
    properties: {
        workbookId: {
            type: 'string',
        },
        collectionId: {
            type: ['string', 'null'],
        },
        title: {
            type: 'string',
        },
        projectIdOverride: {
            type: ['string', 'null'],
        },
        tenantIdOverride: {
            type: 'string',
        },
        accessBindingsServiceEnabled: {
            type: 'boolean',
        },
    },
});

export interface CopyWorkbookArgs {
    workbookId: string;
    collectionId: Nullable<string>;
    title: string;
    projectIdOverride?: Nullable<string>;
    tenantIdOverride?: string;
    accessBindingsServiceEnabled?: boolean;
}

export const copyWorkbook = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: CopyWorkbookArgs,
) => {
    const {
        workbookId,
        collectionId: newCollectionId,
        title: newTitle,
        projectIdOverride,
        tenantIdOverride,
    } = args;

    logInfo(ctx, 'COPY_WORKBOOK_START', {
        workbookId: Utils.encodeId(workbookId),
        newCollectionId,
        newTitle,
        projectIdOverride,
        tenantIdOverride,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const {accessServiceEnabled, accessBindingsServiceEnabled} = ctx.config;

    const {
        tenantId,
        projectId,
        user: {userId},
    } = ctx.get('info');

    const {Workbook} = registry.common.classes.get();

    const originWorkbookModel: Optional<WorkbookModel> = await WorkbookModel.query(getReplica(trx))
        .select()
        .findById(workbookId)
        .where({
            [WorkbookModelColumn.DeletedAt]: null,
        })
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    if (originWorkbookModel === undefined) {
        throw new AppError(US_ERRORS.WORKBOOK_NOT_EXISTS, {
            code: US_ERRORS.WORKBOOK_NOT_EXISTS,
        });
    }

    if (tenantIdOverride === undefined && originWorkbookModel.tenantId !== tenantId) {
        throw new AppError(US_ERRORS.WORKBOOK_NOT_EXISTS, {
            code: US_ERRORS.WORKBOOK_NOT_EXISTS,
        });
    }

    if (
        projectIdOverride === undefined &&
        projectId &&
        originWorkbookModel.projectId !== projectId
    ) {
        throw new AppError(US_ERRORS.WORKBOOK_NOT_EXISTS, {
            code: US_ERRORS.WORKBOOK_NOT_EXISTS,
        });
    }

    const originTenantId = originWorkbookModel.tenantId;
    const targetTenantId = tenantIdOverride ?? tenantId;

    const targetProjectId = projectIdOverride ?? projectId;

    const originWorkbook = new Workbook({
        ctx,
        model: originWorkbookModel,
    });

    if (newCollectionId) {
        await getCollection(
            {ctx, trx, skipValidation: true, skipCheckPermissions: true},
            {collectionId: newCollectionId},
        );
    }

    if (
        accessServiceEnabled &&
        !skipCheckPermissions &&
        tenantIdOverride === undefined &&
        projectIdOverride === undefined
    ) {
        let originWorkbookParentIds: string[] = [];

        if (originWorkbook.model.collectionId !== null) {
            originWorkbookParentIds = await getParentIds({
                ctx,
                collectionId: originWorkbook.model.collectionId,
            });
        }

        await originWorkbook.checkPermission({
            parentIds: originWorkbookParentIds,
            permission: WorkbookPermission.Copy,
        });
    }

    const originEntries = await Entry.query(getReplica(trx))
        .where({
            workbookId,
            tenantId: originTenantId,
            isDeleted: false,
        })
        .timeout(Entry.DEFAULT_QUERY_TIMEOUT);

    const fileConnectionExists = Utils.checkFileConnectionsExistence(originEntries);

    if (fileConnectionExists) {
        throw new AppError(US_ERRORS.WORKBOOK_COPY_FILE_CONNECTION_ERROR, {
            code: US_ERRORS.WORKBOOK_COPY_FILE_CONNECTION_ERROR,
        });
    }

    let operation: any;

    const newWorkbook = await transaction(getPrimary(trx), async (transactionTrx) => {
        const correctedNewTitle = await getUniqWorkbookTitle({
            newTitle,
            tenantId: targetTenantId,
            projectId: targetProjectId,
            collectionId: newCollectionId,
            trx: transactionTrx,
        });

        const copiedWorkbook = await WorkbookModel.query(transactionTrx)
            .insert({
                [WorkbookModelColumn.Title]: correctedNewTitle,
                [WorkbookModelColumn.TitleLower]: correctedNewTitle.toLowerCase(),
                [WorkbookModelColumn.Description]: originWorkbookModel.description,
                [WorkbookModelColumn.TenantId]: targetTenantId,
                [WorkbookModelColumn.ProjectId]: targetProjectId,
                [WorkbookModelColumn.CollectionId]: newCollectionId,
                [WorkbookModelColumn.Meta]: originWorkbookModel.meta,
                [WorkbookModelColumn.CreatedBy]: userId,
                [WorkbookModelColumn.UpdatedBy]: userId,
            })
            .returning('*')
            .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

        if (originEntries.length > 0) {
            const copiedJoinedEntryRevisions = await copyToWorkbook(ctx, {
                entryIds: originEntries.map((entry) => entry.entryId),
                destinationWorkbookId: copiedWorkbook.workbookId,
                tenantIdOverride,
                trxOverride: transactionTrx,
                skipLinkSync: true,
                skipWorkbookPermissionsCheck: true,
            });

            const filteredCopiedJoinedEntryRevisions = copiedJoinedEntryRevisions.filter(
                (item) => item.newJoinedEntryRevision !== undefined,
            ) as {
                newJoinedEntryRevision: JoinedEntryRevisionColumns;
                oldEntryId: string;
            }[];

            await crossSyncCopiedJoinedEntryRevisions({
                copiedJoinedEntryRevisions: filteredCopiedJoinedEntryRevisions,
                ctx,
                trx: transactionTrx,
            });
        }

        if (accessServiceEnabled && accessBindingsServiceEnabled) {
            const workbook = new Workbook({
                ctx,
                model: copiedWorkbook,
            });

            let newCollectionParentIds: string[] = [];

            if (newCollectionId) {
                newCollectionParentIds = await getParentIds({
                    ctx,
                    collectionId: newCollectionId,
                });
            }

            operation = await workbook.register({
                parentIds: newCollectionParentIds,
            });
        }

        return copiedWorkbook;
    });

    logInfo(ctx, 'COPY_WORKBOOK_FINISH', {
        workbookId: Utils.encodeId(newWorkbook.collectionId),
    });

    return {
        workbook: newWorkbook,
        operation,
    };
};

async function getUniqWorkbookTitle({
    newTitle,
    projectId,
    tenantId,
    collectionId,
    trx,
}: {
    newTitle: WorkbookModel['title'];
    projectId: WorkbookModel['projectId'];
    tenantId: WorkbookModel['tenantId'];
    collectionId: WorkbookModel['collectionId'];
    trx: TransactionOrKnex;
}) {
    let uniqTitle = newTitle;

    const newTitleLower = newTitle.toLowerCase();

    const COPY_PREFIX = 'Copy';
    const COPY_PREFIX_LOWER = COPY_PREFIX.toLowerCase();

    const equalWorkbooksByTitleLower = await WorkbookModel.query(trx)
        .where({
            [WorkbookModelColumn.TenantId]: tenantId,
            [WorkbookModelColumn.ProjectId]: projectId,
            [WorkbookModelColumn.CollectionId]: collectionId,
            [WorkbookModelColumn.DeletedAt]: null,
        })
        .andWhere((builder1) => {
            builder1
                .where({
                    [WorkbookModelColumn.TitleLower]: newTitleLower,
                })
                .orWhere((builder2) => {
                    builder2
                        .where(
                            WorkbookModelColumn.TitleLower,
                            'LIKE',
                            `${Utils.escapeStringForLike(newTitleLower)} (${COPY_PREFIX_LOWER} %)`,
                        )
                        .andWhere(
                            WorkbookModelColumn.TitleLower,
                            'NOT LIKE',
                            `${Utils.escapeStringForLike(
                                newTitleLower,
                            )} (${COPY_PREFIX_LOWER} %)_%`,
                        );
                });
        })
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    if (equalWorkbooksByTitleLower.length > 0) {
        let maxCounter = 1;
        equalWorkbooksByTitleLower.forEach((workbook) => {
            if (workbook.titleLower !== newTitleLower) {
                const match = workbook.titleLower.match(/(\d+)\)$/);
                const curCounter = match && match[1] && Number(match[1]);
                if (curCounter) {
                    maxCounter = Math.max(curCounter + 1, maxCounter);
                }
            }
        });

        uniqTitle = `${newTitle} (${COPY_PREFIX} ${maxCounter})`;
    }

    return uniqTitle;
}

export async function crossSyncCopiedJoinedEntryRevisions({
    copiedJoinedEntryRevisions,
    encodedTemplateConnectionId,
    encodedTargetConnectionId,
    ctx,
    trx,
}: {
    copiedJoinedEntryRevisions: {
        newJoinedEntryRevision: JoinedEntryRevisionColumns;
        oldEntryId: string;
    }[];
    encodedTemplateConnectionId?: string;
    encodedTargetConnectionId?: string;
    ctx: AppContext;
    trx: TransactionOrKnex;
}) {
    const newByOldEntryIdMap = new Map<string, string>();

    const arCopiedJoinedEntryRevisions = copiedJoinedEntryRevisions.map(
        ({newJoinedEntryRevision, oldEntryId}) => {
            const newEntryIdEncoded = Utils.encodeId(newJoinedEntryRevision.entryId);
            const oldEntryIdEncoded = Utils.encodeId(oldEntryId);
            newByOldEntryIdMap.set(newEntryIdEncoded, oldEntryIdEncoded);

            return newJoinedEntryRevision;
        },
    );

    if (encodedTemplateConnectionId && encodedTargetConnectionId) {
        newByOldEntryIdMap.set(encodedTargetConnectionId, encodedTemplateConnectionId);
    }

    let strCopiedJoinedEntryRevisions = JSON.stringify(arCopiedJoinedEntryRevisions);
    newByOldEntryIdMap.forEach((value, key) => {
        strCopiedJoinedEntryRevisions = strCopiedJoinedEntryRevisions.replace(
            new RegExp(value, 'g'),
            key,
        );
    });
    const arCopiedJoinedEntryRevisionsWithReplacedIds = JSON.parse(
        strCopiedJoinedEntryRevisions,
    ) as JoinedEntryRevisionColumns[];

    await Promise.all(
        arCopiedJoinedEntryRevisionsWithReplacedIds.map((copiedJoinedEntryRevision) => {
            return crossSyncCopiedJoinedEntryRevision({copiedJoinedEntryRevision, ctx, trx});
        }),
    );
}

async function crossSyncCopiedJoinedEntryRevision({
    copiedJoinedEntryRevision,
    ctx,
    trx,
}: {
    copiedJoinedEntryRevision: JoinedEntryRevisionColumns;
    ctx: AppContext;
    trx: TransactionOrKnex;
}) {
    const syncedLinksWithReplacedIds = copiedJoinedEntryRevision.links as Nullable<
        Record<string, string>
    >;

    if (syncedLinksWithReplacedIds) {
        await Link.sync({
            entryId: copiedJoinedEntryRevision.entryId,
            links: syncedLinksWithReplacedIds,
            ctx,
            trxOverride: trx,
        });
    }

    await RevisionModel.query(trx)
        .findById(copiedJoinedEntryRevision.revId)
        .patch({
            data: copiedJoinedEntryRevision.data,
            meta: copiedJoinedEntryRevision.meta,
            links: syncedLinksWithReplacedIds,
        })
        .timeout(RevisionModel.DEFAULT_QUERY_TIMEOUT);
}
