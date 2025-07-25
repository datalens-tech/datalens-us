import {AppMiddleware, AppRouteDescription, AuthPolicy} from '@gravity-ui/expresskit';
import type {HttpMethod} from '@gravity-ui/expresskit/dist/types';
import type {NodeKit} from '@gravity-ui/nodekit';

import {Feature} from './components/features';
import collections from './controllers/collections';
import colorPalettes from './controllers/color-palettes';
import entries from './controllers/entries';
import favorites from './controllers/favorites';
import helpers from './controllers/helpers';
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

// eslint-disable-next-line complexity
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
        }),

        ping: {
            route: 'GET /ping',
            handler: helpers.ping,
            authPolicy: AuthPolicy.disabled,
        },
        pingDb: {
            route: 'GET /ping-db',
            handler: helpers.pingDb,
            authPolicy: AuthPolicy.disabled,
        },
        pingDbPrimary: {
            route: 'GET /ping-db-primary',
            handler: helpers.pingDbPrimary,
            authPolicy: AuthPolicy.disabled,
        },
        pool: {
            route: 'GET /pool',
            handler: helpers.pool,
            authPolicy: AuthPolicy.disabled,
        },

        getEntry: makeRoute({
            route: 'GET /v1/entries/:entryId',
            handler: entries.getEntry,
        }),
        privateGetEntry: makeRoute({
            route: 'GET /private/entries/:entryId',
            handler: entries.getEntry,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),

        getEntryMeta: makeRoute({
            route: 'GET /v1/entries/:entryId/meta',
            handler: entries.getEntryMeta,
        }),
        privateGetEntryMeta: makeRoute({
            route: 'GET /private/entries/:entryId/meta',
            handler: entries.getEntryMeta,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),
        privateGetEntryMetaAlt: makeRoute({
            route: 'GET /private/getEntryMeta/:entryId',
            handler: entries.getEntryMetaPrivate,
            private: true,
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
            write: true,
            requireCtxTenantId: true,
        }),
        privateCreateEntryAlt: makeRoute({
            route: 'POST /private/createEntry',
            handler: entries.createEntryAltController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
            requireCtxTenantId: true,
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
            write: true,
        }),

        privateSwitchRevisionEntry: makeRoute({
            route: 'POST /private/entries/:entryId/switch-revision',
            handler: entries.switchRevisionEntry,
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
            write: true,
        }),

        getEntries: makeRoute({
            route: 'GET /v1/entries',
            handler: entries.getEntriesController,
            requireCtxTenantId: true,
        }),
        privateGetEntries: makeRoute({
            route: 'GET /private/entries',
            handler: entries.getEntriesController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            requireCtxTenantId: true,
        }),

        getRevisions: makeRoute({
            route: 'GET /v1/entries/:entryId/revisions',
            handler: entries.getRevisions,
        }),
        privateGetRevisions: makeRoute({
            route: 'GET /private/entries/:entryId/revisions',
            handler: entries.getRevisions,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),

        getRelations: makeRoute({
            route: 'GET /v1/entries/:entryId/relations',
            handler: entries.getRelations,
        }),
        privateGetRelations: makeRoute({
            route: 'GET /private/entries/:entryId/relations',
            handler: entries.getRelations,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),

        getEntriesData: makeRoute({
            route: 'POST /v1/get-entries-data',
            handler: entries.getEntriesDataController,
        }),

        verifyLockExistence: makeRoute({
            route: 'GET /v1/locks/:entryId',
            handler: locks.verifyExistence,
        }),
        privateVerifyLockExistence: makeRoute({
            route: 'GET /private/locks/:entryId',
            handler: locks.verifyExistence,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),

        createLock: makeRoute({
            route: 'POST /v1/locks/:entryId',
            handler: locks.lock,
            write: true,
        }),
        privateCreateLock: makeRoute({
            route: 'POST /private/locks/:entryId',
            handler: locks.lock,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        deleteLock: makeRoute({
            route: 'DELETE /v1/locks/:entryId',
            handler: locks.unlock,
            write: true,
        }),
        privateDeleteLock: makeRoute({
            route: 'DELETE /private/locks/:entryId',
            handler: locks.unlock,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        extendLock: makeRoute({
            route: 'POST /v1/locks/:entryId/extend',
            handler: locks.extend,
            write: true,
        }),
        privateExtendLock: makeRoute({
            route: 'POST /private/locks/:entryId/extend',
            handler: locks.extend,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        getState: makeRoute({
            route: 'GET /v1/states/:entryId/:hash',
            handler: states.getState,
        }),
        createState: makeRoute({
            route: 'POST /v1/states/:entryId',
            handler: states.createState,
            write: true,
        }),

        getFavorites: makeRoute({
            route: 'GET /v1/favorites',
            handler: favorites.getFavorites,
        }),
        addFavorite: makeRoute({
            route: 'POST /v1/favorites/:entryId',
            handler: favorites.addFavorite,
            write: true,
        }),
        deleteFavorite: makeRoute({
            route: 'DELETE /v1/favorites/:entryId',
            handler: favorites.deleteFavorite,
            write: true,
        }),
        renameFavorite: makeRoute({
            route: 'POST /v1/favorites/:entryId/rename',
            handler: favorites.renameFavorite,
            write: true,
        }),

        getWorkbookContent: makeRoute({
            route: 'GET /v2/workbooks/:workbookId/entries',
            handler: workbooks.getWorkbookContentController,
            features: [Feature.CollectionsEnabled],
        }),
        privateGetWorkbookContent: makeRoute({
            route: 'GET /private/v2/workbooks/:workbookId/entries',
            handler: workbooks.getWorkbookContentController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.CollectionsEnabled],
        }),
        getWorkbook: makeRoute({
            route: 'GET /v2/workbooks/:workbookId',
            handler: workbooks.getWorkbookController,
            features: [Feature.CollectionsEnabled],
        }),
        privateGetWorkbook: makeRoute({
            route: 'GET /private/v2/workbooks/:workbookId',
            handler: workbooks.getWorkbookController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.CollectionsEnabled],
        }),
        getWorkbooks: makeRoute({
            route: 'GET /v2/workbooks',
            handler: workbooks.getWorkbooksListController,
            features: [Feature.CollectionsEnabled],
        }),
        getWorkbooksListByIds: makeRoute({
            route: 'POST /v2/workbooks-get-list-by-ids',
            handler: workbooks.getWorkbooksListByIdsController,
            features: [Feature.CollectionsEnabled],
        }),
        updateWorkbook: makeRoute({
            route: 'POST /v2/workbooks/:workbookId/update',
            handler: workbooks.updateWorkbookController,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        privateUpdateWorkbook: makeRoute({
            route: 'POST /private/v2/workbooks/:workbookId/update',
            handler: workbooks.updateWorkbookController,
            write: true,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.CollectionsEnabled],
        }),
        createWorkbook: makeRoute({
            route: 'POST /v2/workbooks',
            handler: workbooks.createWorkbookController,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        privateCreateWorkbook: makeRoute({
            route: 'POST /private/v2/workbooks',
            handler: workbooks.createWorkbookController,
            write: true,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.CollectionsEnabled],
            requireCtxTenantId: true,
        }),
        deleteWorkbook: makeRoute({
            route: 'DELETE /v2/workbooks/:workbookId',
            handler: workbooks.deleteWorkbookController,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        privateDeleteWorkbook: makeRoute({
            route: 'DELETE /private/v2/workbooks/:workbookId',
            handler: workbooks.deleteWorkbookController,
            write: true,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.CollectionsEnabled],
        }),
        deleteWorkbooks: makeRoute({
            route: 'DELETE /v2/delete-workbooks',
            handler: workbooks.deleteWorkbooksListController,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        moveWorkbook: makeRoute({
            route: 'POST /v2/workbooks/:workbookId/move',
            handler: workbooks.moveWorkbookController,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        moveWorkbooks: makeRoute({
            route: 'POST /v2/move-workbooks',
            handler: workbooks.moveWorkbooksListController,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        copyWorkbook: makeRoute({
            route: 'POST /v2/workbooks/:workbookId/copy',
            handler: workbooks.copyWorkbookController,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        privateSetIsTemplateWorkbook: makeRoute({
            route: 'POST /private/v2/workbooks/:workbookId/setIsTemplate',
            handler: workbooks.setWorkbookIsTemplateController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),

        privateRestoreWorkbook: makeRoute({
            route: 'POST /private/v2/workbooks/:workbookId/restore',
            handler: workbooks.restoreWorkbookController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),

        privateGetAllWorkbooks: makeRoute({
            route: 'GET /private/all-workbooks',
            handler: workbooks.getAllWorkbooksController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.CollectionsEnabled],
        }),

        createCollection: makeRoute({
            route: 'POST /v1/collections',
            handler: collections.createCollectionController,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        privateCreateCollection: makeRoute({
            route: 'POST /private/v1/collections',
            handler: collections.createCollectionController,
            write: true,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.CollectionsEnabled],
            requireCtxTenantId: true,
        }),
        getCollection: makeRoute({
            route: 'GET /v1/collections/:collectionId',
            handler: collections.getCollectionController,
            features: [Feature.CollectionsEnabled],
        }),
        privateGetCollection: makeRoute({
            route: 'GET /private/v1/collections/:collectionId',
            handler: collections.getCollectionController,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.CollectionsEnabled],
        }),
        getCollectionsListByIds: makeRoute({
            route: 'POST /v1/collections-get-list-by-ids',
            handler: collections.getCollectionsListByIdsController,
            features: [Feature.CollectionsEnabled],
        }),
        getCollectionContent: makeRoute({
            route: 'GET /v1/collection-content',
            handler: collections.getCollectionContentController,
            features: [Feature.CollectionsEnabled],
        }),
        getStructureItems: makeRoute({
            route: 'GET /v1/structure-items',
            handler: structureItems.getStructureItems,
            features: [Feature.CollectionsEnabled],
        }),
        getRootCollectionPermissions: makeRoute({
            route: 'GET /v1/root-collection-permissions',
            handler: collections.getRootPermissionsController,
            features: [Feature.CollectionsEnabled],
        }),
        getCollectionBreadcrumbs: makeRoute({
            route: 'GET /v1/collections/:collectionId/breadcrumbs',
            handler: collections.getCollectionBreadcrumbsController,
            features: [Feature.CollectionsEnabled],
        }),
        deleteCollection: makeRoute({
            route: 'DELETE /v1/collections/:collectionId',
            handler: collections.deleteCollectionController,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        deleteCollections: makeRoute({
            route: 'DELETE /v1/delete-collections',
            handler: collections.deleteCollectionsListController,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        moveCollection: makeRoute({
            route: 'POST /v1/collections/:collectionId/move',
            handler: collections.moveCollectionController,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        moveCollections: makeRoute({
            route: 'POST /v1/move-collections',
            handler: collections.moveCollectionsListController,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        updateCollection: makeRoute({
            route: 'POST /v1/collections/:collectionId/update',
            handler: collections.updateCollectionController,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),

        copyEntryToWorkbook: makeRoute({
            route: 'POST /v2/entries/:entryId/copy',
            handler: entries.copyEntryToWorkbookController,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),

        copyEntriesToWorkbook: makeRoute({
            route: 'POST /v2/copy-entries',
            handler: entries.copyEntriesToWorkbookController,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),

        getColorPalettes: makeRoute({
            route: 'GET /v1/color-palettes',
            handler: colorPalettes.getList,
            features: [Feature.ColorPalettesEnabled],
        }),
        getColorPalette: makeRoute({
            route: 'GET /v1/color-palettes/:colorPaletteId',
            handler: colorPalettes.get,
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
            features: [Feature.ColorPalettesEnabled, Feature.DefaultColorPaletteEnabled],
        }),
    } as const;

    const typedRoutes: {[key in keyof typeof routes]: ExtendedAppRouteDescription} = routes;
    return typedRoutes;
}
