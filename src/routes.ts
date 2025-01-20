import {AppMiddleware, AppRouteDescription, AuthPolicy} from '@gravity-ui/expresskit';
import type {HttpMethod} from '@gravity-ui/expresskit/dist/types';
import type {NodeKit} from '@gravity-ui/nodekit';

import {Feature} from './components/features';
import collectionsController from './controllers/collections';
import colorPalettesController from './controllers/color-palettes';
import entriesController from './controllers/entries';
import favoritesController from './controllers/favorites';
import helpersController from './controllers/helpers';
import homeController from './controllers/home';
import locksController from './controllers/locks';
import statesController from './controllers/states';
import structureItemsController from './controllers/structure-items';
import workbooksController from './controllers/workbooks';

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
            handler: helpersController.ping,
            authPolicy: AuthPolicy.disabled,
        },
        pingDb: {
            route: 'GET /ping-db',
            handler: helpersController.pingDb,
            authPolicy: AuthPolicy.disabled,
        },
        pingDbPrimary: {
            route: 'GET /ping-db-primary',
            handler: helpersController.pingDbPrimary,
            authPolicy: AuthPolicy.disabled,
        },
        pool: {
            route: 'GET /pool',
            handler: helpersController.pool,
            authPolicy: AuthPolicy.disabled,
        },

        getEntry: makeRoute({
            route: 'GET /v1/entries/:entryId',
            handler: entriesController.getEntry,
        }),
        privateGetEntry: makeRoute({
            route: 'GET /private/entries/:entryId',
            handler: entriesController.getEntry,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),

        getEntryMeta: makeRoute({
            route: 'GET /v1/entries/:entryId/meta',
            handler: entriesController.getEntryMeta,
        }),
        privateGetEntryMeta: makeRoute({
            route: 'GET /private/entries/:entryId/meta',
            handler: entriesController.getEntryMeta,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),
        privateGetEntryMetaAlt: makeRoute({
            route: 'GET /private/getEntryMeta/:entryId',
            handler: entriesController.getEntryMetaPrivate,
            private: true,
        }),

        createEntry: makeRoute({
            route: 'POST /v1/entries',
            handler: entriesController.createEntry,
            write: true,
        }),
        privateCreateEntry: makeRoute({
            route: 'POST /private/entries',
            handler: entriesController.createEntry,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),
        privateCreateEntryAlt: makeRoute({
            route: 'POST /private/createEntry',
            handler: entriesController._createEntry,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        updateEntry: makeRoute({
            route: 'POST /v1/entries/:entryId',
            handler: entriesController.updateEntry,
            write: true,
        }),
        privateUpdateEntry: makeRoute({
            route: 'POST /private/entries/:entryId',
            handler: entriesController.updateEntry,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        privateSwitchRevisionEntry: makeRoute({
            route: 'POST /private/entries/:entryId/switch-revision',
            handler: entriesController.switchRevisionEntry,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        renameEntry: makeRoute({
            route: 'POST /v1/entries/:entryId/rename',
            handler: entriesController.renameEntry,
            write: true,
        }),
        privateRenameEntry: makeRoute({
            route: 'POST /private/entries/:entryId/rename',
            handler: entriesController.renameEntry,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        deleteEntry: makeRoute({
            route: 'DELETE /v1/entries/:entryId',
            handler: entriesController.deleteEntry,
            write: true,
        }),
        privateDeleteEntry: makeRoute({
            route: 'DELETE /private/entries/:entryId',
            handler: entriesController.deleteEntry,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        getEntries: makeRoute({
            route: 'GET /v1/entries',
            handler: entriesController.getEntries,
        }),
        privateGetEntries: makeRoute({
            route: 'GET /private/entries',
            handler: entriesController.getEntries,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),

        getRevisions: makeRoute({
            route: 'GET /v1/entries/:entryId/revisions',
            handler: entriesController.getRevisions,
        }),
        privateGetRevisions: makeRoute({
            route: 'GET /private/entries/:entryId/revisions',
            handler: entriesController.getRevisions,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),

        getRelations: makeRoute({
            route: 'GET /v1/entries/:entryId/relations',
            handler: entriesController.getRelations,
        }),
        privateGetRelations: makeRoute({
            route: 'GET /private/entries/:entryId/relations',
            handler: entriesController.getRelations,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),

        getEntriesData: makeRoute({
            route: 'POST /v1/get-entries-data',
            handler: entriesController.getEntriesData,
        }),

        verifyLockExistence: makeRoute({
            route: 'GET /v1/locks/:entryId',
            handler: locksController.verifyExistence,
        }),
        privateVerifyLockExistence: makeRoute({
            route: 'GET /private/locks/:entryId',
            handler: locksController.verifyExistence,
            authPolicy: AuthPolicy.disabled,
            private: true,
        }),

        createLock: makeRoute({
            route: 'POST /v1/locks/:entryId',
            handler: locksController.lock,
            write: true,
        }),
        privateCreateLock: makeRoute({
            route: 'POST /private/locks/:entryId',
            handler: locksController.lock,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        deleteLock: makeRoute({
            route: 'DELETE /v1/locks/:entryId',
            handler: locksController.unlock,
            write: true,
        }),
        privateDeleteLock: makeRoute({
            route: 'DELETE /private/locks/:entryId',
            handler: locksController.unlock,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        extendLock: makeRoute({
            route: 'POST /v1/locks/:entryId/extend',
            handler: locksController.extend,
            write: true,
        }),
        privateExtendLock: makeRoute({
            route: 'POST /private/locks/:entryId/extend',
            handler: locksController.extend,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
        }),

        getState: makeRoute({
            route: 'GET /v1/states/:entryId/:hash',
            handler: statesController.getState,
        }),
        createState: makeRoute({
            route: 'POST /v1/states/:entryId',
            handler: statesController.createState,
            write: true,
        }),

        getFavorites: makeRoute({
            route: 'GET /v1/favorites',
            handler: favoritesController.getFavorites,
        }),
        addFavorite: makeRoute({
            route: 'POST /v1/favorites/:entryId',
            handler: favoritesController.addFavorite,
            write: true,
        }),
        deleteFavorite: makeRoute({
            route: 'DELETE /v1/favorites/:entryId',
            handler: favoritesController.deleteFavorite,
            write: true,
        }),
        renameFavorite: makeRoute({
            route: 'POST /v1/favorites/:entryId/rename',
            handler: favoritesController.renameFavorite,
            write: true,
        }),

        getWorkbookContent: makeRoute({
            route: 'GET /v2/workbooks/:workbookId/entries',
            handler: workbooksController.getContent,
            features: [Feature.CollectionsEnabled],
        }),
        privateGetWorkbookContent: makeRoute({
            route: 'GET /private/v2/workbooks/:workbookId/entries',
            handler: workbooksController.getContent,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.CollectionsEnabled],
        }),
        getWorkbook: makeRoute({
            route: 'GET /v2/workbooks/:workbookId',
            handler: workbooksController.get,
            features: [Feature.CollectionsEnabled],
        }),
        privateGetWorkbook: makeRoute({
            route: 'GET /private/v2/workbooks/:workbookId',
            handler: workbooksController.get,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.CollectionsEnabled],
        }),
        getWorkbooks: makeRoute({
            route: 'GET /v2/workbooks',
            handler: workbooksController.getList,
            features: [Feature.CollectionsEnabled],
        }),
        getWorkbooksListByIds: makeRoute({
            route: 'POST /v2/workbooks-get-list-by-ids',
            handler: workbooksController.getWorkbooksListByIds,
            features: [Feature.CollectionsEnabled],
        }),
        updateWorkbook: makeRoute({
            route: 'POST /v2/workbooks/:workbookId/update',
            handler: workbooksController.updateWorkbook,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        createWorkbook: makeRoute({
            route: 'POST /v2/workbooks',
            handler: workbooksController.createWorkbook,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        privateCreateWorkbook: makeRoute({
            route: 'POST /private/v2/workbooks',
            handler: workbooksController.createWorkbook,
            write: true,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.CollectionsEnabled],
        }),
        deleteWorkbook: makeRoute({
            route: 'DELETE /v2/workbooks/:workbookId',
            handler: workbooksController.deleteWorkbook,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        deleteWorkbooks: makeRoute({
            route: 'DELETE /v2/delete-workbooks',
            handler: workbooksController.deleteWorkbooksList,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        moveWorkbook: makeRoute({
            route: 'POST /v2/workbooks/:workbookId/move',
            handler: workbooksController.moveWorkbook,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        moveWorkbooks: makeRoute({
            route: 'POST /v2/move-workbooks',
            handler: workbooksController.moveWorkbooksList,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        copyWorkbook: makeRoute({
            route: 'POST /v2/workbooks/:workbookId/copy',
            handler: workbooksController.copyWorkbook,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        copyWorkbookTemplate: makeRoute({
            route: 'POST /v2/workbooks/:workbookId/copyTemplate',
            handler: workbooksController.copyTemplate,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        privateSetIsTemplateWorkbook: makeRoute({
            route: 'POST /private/v2/workbooks/:workbookId/setIsTemplate',
            handler: workbooksController.setIsTemplate,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),

        privateRestoreWorkbook: makeRoute({
            route: 'POST /private/v2/workbooks/:workbookId/restore',
            handler: workbooksController.restore,
            authPolicy: AuthPolicy.disabled,
            private: true,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),

        privateGetAllWorkbooks: makeRoute({
            route: 'GET /private/all-workbooks',
            handler: workbooksController.getAll,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.CollectionsEnabled],
        }),

        createCollection: makeRoute({
            route: 'POST /v1/collections',
            handler: collectionsController.createCollection,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        privateCreateCollection: makeRoute({
            route: 'POST /private/v1/collections',
            handler: collectionsController.createCollection,
            write: true,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.CollectionsEnabled],
        }),
        getCollection: makeRoute({
            route: 'GET /v1/collections/:collectionId',
            handler: collectionsController.getCollection,
            features: [Feature.CollectionsEnabled],
        }),
        privateGetCollection: makeRoute({
            route: 'GET /private/v1/collections/:collectionId',
            handler: collectionsController.getCollection,
            authPolicy: AuthPolicy.disabled,
            private: true,
            features: [Feature.CollectionsEnabled],
        }),
        getCollectionsListByIds: makeRoute({
            route: 'POST /v1/collections-get-list-by-ids',
            handler: collectionsController.getCollectionsListByIds,
            features: [Feature.CollectionsEnabled],
        }),
        getCollectionContent: makeRoute({
            route: 'GET /v1/collection-content',
            handler: collectionsController.getCollectionContent,
            features: [Feature.CollectionsEnabled],
        }),
        getStructureItems: makeRoute({
            route: 'GET /v1/structure-items',
            handler: structureItemsController.getStructureItems,
            features: [Feature.CollectionsEnabled],
        }),
        getRootCollectionPermissions: makeRoute({
            route: 'GET /v1/root-collection-permissions',
            handler: collectionsController.getRootPermissions,
            features: [Feature.CollectionsEnabled],
        }),
        getCollectionBreadcrumbs: makeRoute({
            route: 'GET /v1/collections/:collectionId/breadcrumbs',
            handler: collectionsController.getCollectionBreadcrumbs,
            features: [Feature.CollectionsEnabled],
        }),
        deleteCollection: makeRoute({
            route: 'DELETE /v1/collections/:collectionId',
            handler: collectionsController.deleteCollection,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        deleteCollections: makeRoute({
            route: 'DELETE /v1/delete-collections',
            handler: collectionsController.deleteCollectionsList,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        moveCollection: makeRoute({
            route: 'POST /v1/collections/:collectionId/move',
            handler: collectionsController.moveCollection,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        moveCollections: makeRoute({
            route: 'POST /v1/move-collections',
            handler: collectionsController.moveCollectionsList,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),
        updateCollection: makeRoute({
            route: 'POST /v1/collections/:collectionId/update',
            handler: collectionsController.updateCollection,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),

        copyEntryToWorkbook: makeRoute({
            route: 'POST /v2/entries/:entryId/copy',
            handler: entriesController.copyEntryToWorkbook,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),

        copyEntriesToWorkbook: makeRoute({
            route: 'POST /v2/copy-entries',
            handler: entriesController.copyEntriesToWorkbook,
            write: true,
            features: [Feature.CollectionsEnabled],
        }),

        getColorPalettes: makeRoute({
            route: 'GET /v1/color-palettes',
            handler: colorPalettesController.getList,
            features: [Feature.ColorPalettesEnabled],
        }),
        getColorPalette: makeRoute({
            route: 'GET /v1/color-palettes/:colorPaletteId',
            handler: colorPalettesController.get,
            authPolicy: AuthPolicy.disabled,
            features: [Feature.ColorPalettesEnabled],
        }),
        createColorPalette: makeRoute({
            route: 'POST /v1/color-palettes',
            handler: colorPalettesController.create,
            write: true,
            features: [Feature.ColorPalettesEnabled],
        }),
        updateColorPalette: makeRoute({
            route: 'POST /v1/color-palettes/:colorPaletteId/update',
            handler: colorPalettesController.update,
            write: true,
            features: [Feature.ColorPalettesEnabled],
        }),
        deleteColorPalette: makeRoute({
            route: 'DELETE /v1/color-palettes/:colorPaletteId',
            handler: colorPalettesController.delete,
            write: true,
            features: [Feature.ColorPalettesEnabled],
        }),
    } as const;

    const typedRoutes: {[key in keyof typeof routes]: ExtendedAppRouteDescription} = routes;
    return typedRoutes;
}
