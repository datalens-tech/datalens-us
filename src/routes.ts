import {AppMiddleware, AppRouteDescription, AuthPolicy} from '@gravity-ui/expresskit';
import type {HttpMethod} from '@gravity-ui/expresskit/dist/types';
import type {NodeKit} from '@gravity-ui/nodekit';

import {Feature} from './components/features';
import {PrivateRouteTag} from './const';
import collections from './controllers/collections';
import colorPalettes from './controllers/color-palettes';
import entries from './controllers/entries';
import favorites from './controllers/favorites';
import homeController from './controllers/home';
import locks from './controllers/locks';
import states from './controllers/states';
import structureItems from './controllers/structure-items';
import tenants from './controllers/tenants';
import workbooks from './controllers/workbooks';

export type GetRoutesOptions = {
    beforeAuth: AppMiddleware[];
    afterAuth: AppMiddleware[];
};

export type ExtendedAppRouteDescription<F = Feature> = AppRouteDescription & {
    route: `${Uppercase<HttpMethod>} ${string}`;
    features?: F[];
};

export function getRoutes(_nodekit: NodeKit, options: GetRoutesOptions) {
    const makeRoute = (
        routeDescription: ExtendedAppRouteDescription,
    ): ExtendedAppRouteDescription => ({
        ...options,
        ...routeDescription,
    });

    const routes = {
        home: makeRoute({
            route: 'GET /',
            handler: homeController,
            disableSelfStats: true,
        }),

        getEntry: makeRoute({
            route: 'GET /v1/entries/:entryId',
            handler: entries.getEntryController,
        }),
        privateGetEntry: makeRoute({
            route: 'GET /private/entries/:entryId',
            handler: entries.getEntryController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            privateTags: [PrivateRouteTag.EntriesCrud],
        }),

        getEntryMeta: makeRoute({
            route: 'GET /v1/entries/:entryId/meta',
            handler: entries.getEntryMetaController,
        }),
        privateGetEntryMeta: makeRoute({
            route: 'GET /private/entries/:entryId/meta',
            handler: entries.getEntryMetaController,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),

        getEntryAccessDescription: makeRoute({
            route: 'GET /v1/entries/:entryId/access-description',
            handler: entries.getEntryAccessDescriptionController,
        }),

        createEntry: makeRoute({
            route: 'POST /v1/entries',
            handler: entries.createEntryController,
            write: true,
        }),
        privateCreateEntry: makeRoute({
            route: 'POST /private/entries',
            handler: entries.createEntryController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            privateTags: [PrivateRouteTag.EntriesCrud],
            write: true,
            requireCtxTenantId: true,
        }),
        checkEntriesExistence: makeRoute({
            route: 'POST /v1/check-entries-existence',
            handler: entries.checkEntriesExistenceController,
        }),
        updateEntry: makeRoute({
            route: 'POST /v1/entries/:entryId',
            handler: entries.updateEntryController,
            write: true,
        }),
        privateUpdateEntry: makeRoute({
            route: 'POST /private/entries/:entryId',
            handler: entries.updateEntryController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            privateTags: [PrivateRouteTag.EntriesCrud],
            write: true,
        }),

        privateUpdateUnversionedData: makeRoute({
            route: 'POST /private/entries/:entryId/unversioned-data',
            handler: entries.updateEntryUnversionedDataPrivateController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
            requireCtxTenantId: true,
        }),

        privateSwitchRevisionEntry: makeRoute({
            route: 'POST /private/entries/:entryId/switch-revision',
            handler: entries.switchRevisionEntryController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        renameEntry: makeRoute({
            route: 'POST /v1/entries/:entryId/rename',
            handler: entries.renameEntryController,
            write: true,
        }),
        privateRenameEntry: makeRoute({
            route: 'POST /private/entries/:entryId/rename',
            handler: entries.renameEntryController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        deleteEntry: makeRoute({
            route: 'DELETE /v1/entries/:entryId',
            handler: entries.deleteEntryController,
            write: true,
        }),
        privateDeleteEntry: makeRoute({
            route: 'DELETE /private/entries/:entryId',
            handler: entries.deleteEntryController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            privateTags: [PrivateRouteTag.EntriesCrud],
            write: true,
        }),

        getEntries: makeRoute({
            route: 'GET /v1/entries',
            handler: entries.getEntriesController,
        }),
        privateGetEntries: makeRoute({
            route: 'GET /private/entries',
            handler: entries.getEntriesController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            requireCtxTenantId: true,
        }),

        getEntriesV2: makeRoute({
            route: 'POST /v1/get-entries',
            handler: entries.getEntriesV2Controller,
        }),
        privateGetEntriesV2: makeRoute({
            route: 'POST /private/v1/get-entries',
            handler: entries.getEntriesV2Controller,
            authPolicy: AuthPolicy.disabled,
            private: true,
            requireCtxTenantId: true,
        }),

        getRevisions: makeRoute({
            route: 'GET /v1/entries/:entryId/revisions',
            handler: entries.getRevisionsController,
        }),
        privateGetRevisions: makeRoute({
            route: 'GET /private/entries/:entryId/revisions',
            handler: entries.getRevisionsController,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),

        getRelations: makeRoute({
            route: 'GET /v1/entries/:entryId/relations',
            handler: entries.getRelationsController,
        }),
        privateGetRelations: makeRoute({
            route: 'GET /private/entries/:entryId/relations',
            handler: entries.getRelationsController,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),
        getEntriesRelations: makeRoute({
            route: 'POST /v1/get-entries-relations',
            handler: entries.getEntriesRelationsController,
        }),
        privateGetEntriesRelations: makeRoute({
            route: 'POST /private/v1/get-entries-relations',
            handler: entries.getEntriesRelationsController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            requireCtxTenantId: true,
        }),

        getEntriesData: makeRoute({
            route: 'POST /v1/get-entries-data',
            handler: entries.getEntriesDataController,
        }),

        getEntriesMeta: makeRoute({
            route: 'POST /v1/get-entries-meta',
            handler: entries.getEntriesMetaController,
        }),

        getEntriesAnnotation: makeRoute({
            route: 'POST /v1/get-entries-annotation',
            handler: entries.getEntriesAnnotationController,
        }),

        verifyLockExistence: makeRoute({
            route: 'GET /v1/locks/:entryId',
            handler: locks.verifyExistenceController,
        }),
        privateVerifyLockExistence: makeRoute({
            route: 'GET /private/locks/:entryId',
            handler: locks.verifyExistenceController,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),

        createLock: makeRoute({
            route: 'POST /v1/locks/:entryId',
            handler: locks.lockController,
            write: true,
        }),
        privateCreateLock: makeRoute({
            route: 'POST /private/locks/:entryId',
            handler: locks.lockController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        deleteLock: makeRoute({
            route: 'DELETE /v1/locks/:entryId',
            handler: locks.unlockController,
            write: true,
        }),
        privateDeleteLock: makeRoute({
            route: 'DELETE /private/locks/:entryId',
            handler: locks.unlockController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        extendLock: makeRoute({
            route: 'POST /v1/locks/:entryId/extend',
            handler: locks.extendController,
            write: true,
        }),
        privateExtendLock: makeRoute({
            route: 'POST /private/locks/:entryId/extend',
            handler: locks.extendController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        getState: makeRoute({
            route: 'GET /v1/states/:entryId/:hash',
            handler: states.getStateController,
        }),
        createState: makeRoute({
            route: 'POST /v1/states/:entryId',
            handler: states.createStateController,
            write: true,
        }),

        getFavorites: makeRoute({
            route: 'GET /v1/favorites',
            handler: favorites.getFavoritesController,
        }),
        addFavorite: makeRoute({
            route: 'POST /v1/favorites/:entryId',
            handler: favorites.addFavoriteController,
            write: true,
        }),
        deleteFavorite: makeRoute({
            route: 'DELETE /v1/favorites/:entryId',
            handler: favorites.deleteFavoriteController,
            write: true,
        }),
        renameFavorite: makeRoute({
            route: 'POST /v1/favorites/:entryId/rename',
            handler: favorites.renameFavoriteController,
            write: true,
        }),

        getWorkbookContent: makeRoute({
            route: 'GET /v2/workbooks/:workbookId/entries',
            handler: workbooks.getWorkbookContentController,
        }),
        privateGetWorkbookContent: makeRoute({
            route: 'GET /private/v2/workbooks/:workbookId/entries',
            handler: workbooks.getWorkbookContentController,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),
        getWorkbook: makeRoute({
            route: 'GET /v2/workbooks/:workbookId',
            handler: workbooks.getWorkbookController,
        }),
        privateGetWorkbook: makeRoute({
            route: 'GET /private/v2/workbooks/:workbookId',
            handler: workbooks.getWorkbookController,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),
        getWorkbooks: makeRoute({
            route: 'GET /v2/workbooks',
            handler: workbooks.getWorkbooksListController,
        }),
        getWorkbooksListByIds: makeRoute({
            route: 'POST /v2/workbooks-get-list-by-ids',
            handler: workbooks.getWorkbooksListByIdsController,
        }),
        updateWorkbook: makeRoute({
            route: 'POST /v2/workbooks/:workbookId/update',
            handler: workbooks.updateWorkbookController,
            write: true,
        }),
        privateUpdateWorkbook: makeRoute({
            route: 'POST /private/v2/workbooks/:workbookId/update',
            handler: workbooks.updateWorkbookController,
            write: true,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),
        createWorkbook: makeRoute({
            route: 'POST /v2/workbooks',
            handler: workbooks.createWorkbookController,
            write: true,
        }),
        privateCreateWorkbook: makeRoute({
            route: 'POST /private/v2/workbooks',
            handler: workbooks.createWorkbookController,
            write: true,
            authPolicy: AuthPolicy.disabled,
            private: true,
            requireCtxTenantId: true,
        }),
        deleteWorkbook: makeRoute({
            route: 'DELETE /v2/workbooks/:workbookId',
            handler: workbooks.deleteWorkbookController,
            write: true,
        }),
        privateDeleteWorkbook: makeRoute({
            route: 'DELETE /private/v2/workbooks/:workbookId',
            handler: workbooks.deleteWorkbookController,
            write: true,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),
        deleteWorkbooks: makeRoute({
            route: 'DELETE /v2/delete-workbooks',
            handler: workbooks.deleteWorkbooksListController,
            write: true,
        }),
        moveWorkbook: makeRoute({
            route: 'POST /v2/workbooks/:workbookId/move',
            handler: workbooks.moveWorkbookController,
            write: true,
        }),
        moveWorkbooks: makeRoute({
            route: 'POST /v2/move-workbooks',
            handler: workbooks.moveWorkbooksListController,
            write: true,
        }),
        copyWorkbook: makeRoute({
            route: 'POST /v2/workbooks/:workbookId/copy',
            handler: workbooks.copyWorkbookController,
            write: true,
        }),
        privateRestoreWorkbook: makeRoute({
            route: 'POST /private/v2/workbooks/:workbookId/restore',
            handler: workbooks.restoreWorkbookController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        privateGetAllWorkbooks: makeRoute({
            route: 'GET /private/all-workbooks',
            handler: workbooks.getAllWorkbooksController,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),

        createCollection: makeRoute({
            route: 'POST /v1/collections',
            handler: collections.createCollectionController,
            write: true,
        }),
        privateCreateCollection: makeRoute({
            route: 'POST /private/v1/collections',
            handler: collections.createCollectionController,
            write: true,
            authPolicy: AuthPolicy.disabled,
            private: true,
            requireCtxTenantId: true,
        }),
        getCollection: makeRoute({
            route: 'GET /v1/collections/:collectionId',
            handler: collections.getCollectionController,
        }),
        privateGetCollection: makeRoute({
            route: 'GET /private/v1/collections/:collectionId',
            handler: collections.getCollectionController,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),
        getCollectionsListByIds: makeRoute({
            route: 'POST /v1/collections-get-list-by-ids',
            handler: collections.getCollectionsListByIdsController,
        }),
        getCollectionContent: makeRoute({
            route: 'GET /v1/collection-content',
            handler: collections.getCollectionContentController,
        }),
        getStructureItems: makeRoute({
            route: 'GET /v1/structure-items',
            handler: structureItems.getStructureItemsController,
        }),
        getRootCollectionPermissions: makeRoute({
            route: 'GET /v1/root-collection-permissions',
            handler: collections.getRootPermissionsController,
        }),
        getCollectionBreadcrumbs: makeRoute({
            route: 'GET /v1/collections/:collectionId/breadcrumbs',
            handler: collections.getCollectionBreadcrumbsController,
        }),
        deleteCollection: makeRoute({
            route: 'DELETE /v1/collections/:collectionId',
            handler: collections.deleteCollectionController,
            write: true,
        }),
        deleteCollections: makeRoute({
            route: 'DELETE /v1/delete-collections',
            handler: collections.deleteCollectionsListController,
            write: true,
        }),
        moveCollection: makeRoute({
            route: 'POST /v1/collections/:collectionId/move',
            handler: collections.moveCollectionController,
            write: true,
        }),
        moveCollections: makeRoute({
            route: 'POST /v1/move-collections',
            handler: collections.moveCollectionsListController,
            write: true,
        }),
        updateCollection: makeRoute({
            route: 'POST /v1/collections/:collectionId/update',
            handler: collections.updateCollectionController,
            write: true,
        }),

        copyEntryToWorkbook: makeRoute({
            route: 'POST /v2/entries/:entryId/copy',
            handler: entries.copyEntryToWorkbookController,
            write: true,
        }),

        copyEntriesToWorkbook: makeRoute({
            route: 'POST /v2/copy-entries',
            handler: entries.copyEntriesToWorkbookController,
            write: true,
        }),

        getColorPalettes: makeRoute({
            route: 'GET /v1/color-palettes',
            handler: colorPalettes.getColorPalettesListController,
            features: [Feature.ColorPalettesEnabled],
        }),
        getColorPalette: makeRoute({
            route: 'GET /v1/color-palettes/:colorPaletteId',
            handler: colorPalettes.getColorPaletteController,
            authPolicy: AuthPolicy.disabled,
            features: [Feature.ColorPalettesEnabled],
        }),
        createColorPalette: makeRoute({
            route: 'POST /v1/color-palettes',
            handler: colorPalettes.createColorPaletteController,
            write: true,
            features: [Feature.ColorPalettesEnabled],
        }),
        updateColorPalette: makeRoute({
            route: 'POST /v1/color-palettes/:colorPaletteId/update',
            handler: colorPalettes.updateColorPaletteController,
            write: true,
            features: [Feature.ColorPalettesEnabled],
        }),
        deleteColorPalette: makeRoute({
            route: 'DELETE /v1/color-palettes/:colorPaletteId',
            handler: colorPalettes.deleteColorPaletteController,
            write: true,
            features: [Feature.ColorPalettesEnabled],
        }),

        setDefaultColorPalette: makeRoute({
            route: 'POST /v1/tenants/set-default-color-palette',
            handler: tenants.setDefaultColorPaletteController,
            write: true,
            features: [Feature.ColorPalettesEnabled],
        }),

        updateTenantSettings: makeRoute({
            route: 'POST /v1/tenants/settings',
            handler: tenants.updateTenantSettingsController,
            features: [Feature.TenantsEnabled],
            write: true,
        }),
        getTenantDetails: makeRoute({
            route: 'GET /v1/tenants/details',
            handler: tenants.getTenantDetailsController,
            features: [Feature.TenantsEnabled],
        }),
        privateGetTenantDetails: makeRoute({
            route: 'GET /private/tenants/:tenantId/details',
            handler: tenants.getTenantDetailsByIdController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.TenantsEnabled],
        }),
        privateResolveTenantByEntryId: makeRoute({
            route: 'GET /private/resolveTenantByEntryId',
            handler: tenants.resolveTenantByEntryIdController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.TenantsEnabled],
        }),
        privateResolveTenant: makeRoute({
            route: 'GET /private/resolve-tenant',
            handler: tenants.resolveTenantController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.TenantsEnabled],
        }),
    } as const;

    const typedRoutes: {[key in keyof typeof routes]: ExtendedAppRouteDescription} = routes;
    return typedRoutes;
}
