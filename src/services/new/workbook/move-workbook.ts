import {AppError} from '@gravity-ui/nodekit';
import {getWorkbook} from './get-workbook';
import {checkWorkbookByTitle} from './check-workbook-by-title';
import {getParentIds} from '../collection/utils';
import {ServiceArgs} from '../types';
import {getPrimary} from '../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {CURRENT_TIMESTAMP, US_ERRORS} from '../../../const';
import {OrganizationPermission, ProjectPermission} from '../../../components/iam';
import {raw} from 'objection';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import Utils from '../../../utils';
import {WorkbookPermission} from '../../../entities/workbook';
import {CollectionPermission} from '../../../entities/collection';
import {getCollection} from '../collection';
import {Feature, isEnabledFeature} from '../../../components/features';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['workbookId', 'collectionId'],
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
    },
});

export interface MoveWorkbookArgs {
    workbookId: string;
    collectionId: Nullable<string>;
    title?: string;
}

export const moveWorkbook = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: MoveWorkbookArgs,
) => {
    const {workbookId, collectionId: newCollectionId, title: newTitle} = args;

    ctx.log('MOVE_WORKBOOK_START', {
        workbookId: Utils.encodeId(workbookId),
        newCollectionId: newCollectionId ? Utils.encodeId(newCollectionId) : null,
        newTitle,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const {accessServiceEnabled} = ctx.config;

    const {
        user: {userId},
    } = ctx.get('info');
    const registry = ctx.get('registry');

    const targetTrx = getPrimary(trx);

    const {checkOrganizationPermission, checkProjectPermission} = registry.common.functions.get();

    const workbook = await getWorkbook(
        {ctx, trx: targetTrx, skipValidation: true, skipCheckPermissions: true},
        {workbookId},
    );

    if (accessServiceEnabled && !skipCheckPermissions) {
        let parentIds: string[] = [];

        if (workbook.model.collectionId !== null) {
            parentIds = await getParentIds({
                ctx,
                trx: targetTrx,
                collectionId: workbook.model.collectionId,
            });
        }

        await workbook.checkPermission({
            parentIds,
            permission: WorkbookPermission.Move,
        });

        if (newCollectionId) {
            const newCollection = await getCollection(
                {ctx, trx: targetTrx, skipValidation: true, skipCheckPermissions: true},
                {collectionId: newCollectionId},
            );

            let newCollectionParentIds: string[] = [];

            if (newCollection.model.parentId !== null) {
                newCollectionParentIds = await getParentIds({
                    ctx,
                    trx: targetTrx,
                    collectionId: newCollection.model.parentId,
                });
            }

            await newCollection.checkPermission({
                parentIds: newCollectionParentIds,
                permission: CollectionPermission.CreateWorkbook,
            });
        } else if (isEnabledFeature(ctx, Feature.ProjectsEnabled)) {
            await checkProjectPermission({
                ctx,
                permission: ProjectPermission.CreateWorkbookInRoot,
            });
        } else {
            await checkOrganizationPermission({
                ctx,
                permission: OrganizationPermission.CreateWorkbookInRoot,
            });
        }
    }

    const titleForPatch = newTitle ?? workbook.model.title;

    const checkWorkbookByTitleResult = await checkWorkbookByTitle(
        {
            ctx,
            trx: targetTrx,
            skipValidation: true,
            skipCheckPermissions,
        },
        {
            title: titleForPatch,
            collectionId: newCollectionId,
        },
    );

    if (checkWorkbookByTitleResult === true) {
        throw new AppError(US_ERRORS.WORKBOOK_ALREADY_EXISTS, {
            code: US_ERRORS.WORKBOOK_ALREADY_EXISTS,
        });
    }

    const patchedWorkbook = await WorkbookModel.query(targetTrx)
        .patch({
            [WorkbookModelColumn.Title]: titleForPatch,
            [WorkbookModelColumn.TitleLower]: titleForPatch.toLowerCase(),
            [WorkbookModelColumn.CollectionId]: newCollectionId,
            [WorkbookModelColumn.UpdatedBy]: userId,
            [WorkbookModelColumn.UpdatedAt]: raw(CURRENT_TIMESTAMP),
        })
        .where({
            [WorkbookModelColumn.WorkbookId]: workbookId,
        })
        .returning('*')
        .first()
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    if (!patchedWorkbook) {
        throw new AppError(US_ERRORS.WORKBOOK_NOT_EXISTS, {
            code: US_ERRORS.WORKBOOK_NOT_EXISTS,
        });
    }

    ctx.log('MOVE_WORKBOOK_FINISH', {
        workbookId: Utils.encodeId(patchedWorkbook.workbookId),
    });

    return patchedWorkbook;
};
