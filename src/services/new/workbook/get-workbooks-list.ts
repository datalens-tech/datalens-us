import {AppError} from '@gravity-ui/nodekit';
import {ServiceArgs} from '../types';
import {getReplica} from '../utils';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {US_ERRORS, DEFAULT_PAGE, DEFAULT_PAGE_SIZE} from '../../../const';
import {WorkbookModel, WorkbookModelColumn} from '../../../db/models/new/workbook';
import {CollectionModel} from '../../../db/models/new/collection';
import Utils, {logInfo} from '../../../utils';
import {WorkbookPermission} from '../../../entities/workbook';
import {CollectionPermission} from '../../../entities/collection';
import {getParents} from '../collection/utils';
import {registry} from '../../../registry';
import {Feature, isEnabledFeature} from '../../../components/features';

const validateArgs = makeSchemaValidator({
    type: 'object',
    required: ['collectionId'],
    properties: {
        collectionId: {
            type: ['string', 'null'],
        },
        includePermissionsInfo: {
            type: 'boolean',
        },
        filterString: {
            type: 'string',
        },
        page: {
            type: 'number',
            minimim: 0,
        },
        pageSize: {
            type: 'number',
            minimum: 1,
            maximum: 1000,
        },
        orderField: {
            type: 'string',
            enum: ['title', 'createdAt', 'updatedAt'],
        },
        orderDirection: {
            type: 'string',
            enum: ['asc', 'desc'],
        },
    },
});

export type OrderField = 'title' | 'createdAt' | 'updatedAt';

export type OrderDirection = 'asc' | 'desc';

export interface GetWorkbookListArgs {
    collectionId: Nullable<string>;
    includePermissionsInfo?: boolean;
    filterString?: string;
    page?: number;
    pageSize?: number;
    orderField?: OrderField;
    orderDirection?: OrderDirection;
    onlyMy?: boolean;
}

export const getWorkbooksList = async (
    {ctx, trx, skipValidation = false, skipCheckPermissions = false}: ServiceArgs,
    args: GetWorkbookListArgs,
) => {
    const {
        collectionId,
        includePermissionsInfo = false,
        filterString,
        page = DEFAULT_PAGE,
        pageSize = DEFAULT_PAGE_SIZE,
        orderField = 'title',
        orderDirection = 'asc',
        onlyMy = false,
    } = args;

    logInfo(ctx, 'GET_WORKBOOKS_LIST_START', {
        collectionId: collectionId ? Utils.encodeId(collectionId) : null,
        filterString,
        page,
        pageSize,
        orderField,
        orderDirection,
    });

    if (!skipValidation) {
        validateArgs(args);
    }

    const {accessServiceEnabled} = ctx.config;
    const {Workbook, Collection} = registry.common.classes.get();
    const {bulkFetchWorkbooksAllPermissions} = registry.common.functions.get();

    const {
        tenantId,
        projectId,
        user: {userId},
    } = ctx.get('info');

    const targetTrx = getReplica(trx);

    let parents: CollectionModel[] = [];

    if (collectionId !== null) {
        parents = await getParents({
            ctx,
            trx: targetTrx,
            collectionIds: [collectionId],
        });

        if (parents.length === 0) {
            throw new AppError(US_ERRORS.COLLECTION_NOT_EXISTS, {
                code: US_ERRORS.COLLECTION_NOT_EXISTS,
            });
        }

        if (accessServiceEnabled && !skipCheckPermissions) {
            const collection = new Collection({
                ctx,
                model: parents[0],
            });

            await collection.checkPermission({
                parentIds: parents.slice(1).map((model) => model.collectionId),
                permission: isEnabledFeature(ctx, Feature.UseLimitedView)
                    ? CollectionPermission.LimitedView
                    : CollectionPermission.View,
            });
        }
    }

    const workbooksPage = await WorkbookModel.query(targetTrx)
        .select()
        .where({
            [WorkbookModelColumn.TenantId]: tenantId,
            [WorkbookModelColumn.ProjectId]: projectId,
            [WorkbookModelColumn.CollectionId]: collectionId,
            [WorkbookModelColumn.DeletedAt]: null,
        })
        .where((qb) => {
            if (filterString) {
                const preparedFilterString = Utils.escapeStringForLike(filterString.toLowerCase());
                qb.where(WorkbookModelColumn.TitleLower, 'LIKE', `%${preparedFilterString}%`);
            }
            if (onlyMy) {
                qb.where({
                    [WorkbookModelColumn.CreatedBy]: userId,
                });
            }
        })
        .orderBy(
            orderField === 'title' ? WorkbookModelColumn.SortTitle : orderField,
            orderDirection,
        )
        .page(page, pageSize)
        .timeout(WorkbookModel.DEFAULT_QUERY_TIMEOUT);

    const nextPageToken = Utils.getNextPageToken(page, pageSize, workbooksPage.total);

    let workbooks: InstanceType<typeof Workbook>[] = [];

    if (workbooksPage.results.length > 0) {
        if (accessServiceEnabled && !skipCheckPermissions) {
            const parentIds = parents.map((model) => model.collectionId);

            workbooks = workbooksPage.results.map((model) => {
                return new Workbook({ctx, model});
            });

            const checkedWorkbooks = await Promise.all(
                workbooks.map(async (workbook) => {
                    try {
                        await workbook.checkPermission({
                            parentIds,
                            permission: isEnabledFeature(ctx, Feature.UseLimitedView)
                                ? WorkbookPermission.LimitedView
                                : WorkbookPermission.View,
                        });

                        return workbook;
                    } catch (error) {
                        const err = error as AppError;

                        if (err.code === US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED) {
                            return null;
                        }

                        throw error;
                    }
                }),
            );

            workbooks = checkedWorkbooks.filter((workbook) => workbook !== null) as InstanceType<
                typeof Workbook
            >[];

            if (includePermissionsInfo) {
                workbooks = await bulkFetchWorkbooksAllPermissions(
                    ctx,
                    workbooks.map((workbook) => ({
                        model: workbook.model,
                        parentIds,
                    })),
                );
            }
        } else {
            workbooks = workbooksPage.results.map((model) => {
                const workbook = new Workbook({ctx, model});

                if (includePermissionsInfo) {
                    workbook.enableAllPermissions();
                }

                return workbook;
            });
        }
    }

    ctx.log('GET_WORKBOOKS_LIST_FINISH', {
        workbooksCount: workbooks.length,
        nextPageToken,
    });

    return {
        workbooks,
        nextPageToken,
    };
};
