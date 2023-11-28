import {AuthPolicy, AppMiddleware, AppRouteDescription} from '@gravity-ui/expresskit';
import type {HttpMethod} from '@gravity-ui/expresskit/dist/types';
import {NodeKit} from '@gravity-ui/nodekit';
import {isEnabledFeature, Feature} from './components/features';

import homeController from './controllers/home';
import helpersController from './controllers/helpers';
import entriesController from './controllers/entries';
import locksController from './controllers/locks';
import statesController from './controllers/states';
import favoritesController from './controllers/favorites';
import workbooksController from './controllers/workbooks';
import collectionsController from './controllers/collections';
import colorPalettesController from './controllers/color-palettes';

export type GetRoutesOptions = {
    beforeAuth: AppMiddleware[];
    afterAuth: AppMiddleware[];
};

export type ExtendedAppRouteDescription = AppRouteDescription & {
    route: `${Uppercase<HttpMethod>} ${string}`;
};

// eslint-disable-next-line complexity
export function getRoutes(nodekit: NodeKit, options: GetRoutesOptions) {
    const {ctx} = nodekit;

    const makeRoute = (
        routeDescription: ExtendedAppRouteDescription,
    ): ExtendedAppRouteDescription => ({
        ...options,
        ...routeDescription,
    });

    let routes: Record<string, ExtendedAppRouteDescription> = {
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
    };

    if (isEnabledFeature(ctx, Feature.CollectionsEnabled)) {
        routes = {
            ...routes,

            getWorkbookContent: makeRoute({
                route: 'GET /v2/workbooks/:workbookId/entries',
                handler: workbooksController.getContent,
            }),
            privateGetWorkbookContent: makeRoute({
                route: 'GET /private/v2/workbooks/:workbookId/entries',
                handler: workbooksController.getContent,
                authPolicy: AuthPolicy.disabled,
                private: true,
            }),
            getWorkbook: makeRoute({
                route: 'GET /v2/workbooks/:workbookId',
                handler: workbooksController.get,
            }),
            privateGetWorkbook: makeRoute({
                route: 'GET /private/v2/workbooks/:workbookId',
                handler: workbooksController.get,
                authPolicy: AuthPolicy.disabled,
                private: true,
            }),
            getWorkbooks: makeRoute({
                route: 'GET /v2/workbooks',
                handler: workbooksController.getList,
            }),
            updateWorkbook: makeRoute({
                route: 'POST /v2/workbooks/:workbookId/update',
                handler: workbooksController.update,
                write: true,
            }),
            createWorkbook: makeRoute({
                route: 'POST /v2/workbooks',
                handler: workbooksController.create,
                write: true,
            }),
            privateCreateWorkbook: makeRoute({
                route: 'POST /private/v2/workbooks',
                handler: workbooksController.create,
                write: true,
                authPolicy: AuthPolicy.disabled,
                private: true,
            }),
            deleteWorkbook: makeRoute({
                route: 'DELETE /v2/workbooks/:workbookId',
                handler: workbooksController.delete,
                write: true,
            }),
            moveWorkbook: makeRoute({
                route: 'POST /v2/workbooks/:workbookId/move',
                handler: workbooksController.move,
                write: true,
            }),
            moveWorkbooks: makeRoute({
                route: 'POST /v2/move-workbooks',
                handler: workbooksController.moveList,
                write: true,
            }),
            copyWorkbook: makeRoute({
                route: 'POST /v2/workbooks/:workbookId/copy',
                handler: workbooksController.copy,
                write: true,
            }),
            copyWorkbookTemplate: makeRoute({
                route: 'POST /v2/workbooks/:workbookId/copyTemplate',
                handler: workbooksController.copyTemplate,
                write: true,
            }),
            privateSetIsTemplateWorkbook: makeRoute({
                route: 'POST /private/v2/workbooks/:workbookId/setIsTemplate',
                handler: workbooksController.setIsTemplate,
                authPolicy: AuthPolicy.disabled,
                private: true,
                write: true,
            }),

            privateRestoreWorkbook: makeRoute({
                route: 'POST /private/v2/workbooks/:workbookId/restore',
                handler: workbooksController.restore,
                authPolicy: AuthPolicy.disabled,
                private: true,
                write: true,
            }),

            privateGetAllWorkbooks: makeRoute({
                route: 'GET /private/all-workbooks',
                handler: workbooksController.getAll,
                authPolicy: AuthPolicy.disabled,
                private: true,
            }),

            createCollection: makeRoute({
                route: 'POST /v1/collections',
                handler: collectionsController.create,
                write: true,
            }),
            privateCreateCollection: makeRoute({
                route: 'POST /private/v1/collections',
                handler: collectionsController.create,
                write: true,
                authPolicy: AuthPolicy.disabled,
                private: true,
            }),
            getCollection: makeRoute({
                route: 'GET /v1/collections/:collectionId',
                handler: collectionsController.get,
            }),
            privateGetCollection: makeRoute({
                route: 'GET /private/v1/collections/:collectionId',
                handler: collectionsController.get,
                authPolicy: AuthPolicy.disabled,
                private: true,
            }),
            getCollectionContent: makeRoute({
                route: 'GET /v1/collection-content',
                handler: collectionsController.getContent,
            }),
            getRootCollectionPermissions: makeRoute({
                route: 'GET /v1/root-collection-permissions',
                handler: collectionsController.getRootPermissions,
            }),
            getCollectionBreadcrumbs: makeRoute({
                route: 'GET /v1/collections/:collectionId/breadcrumbs',
                handler: collectionsController.getBreadcrumbs,
            }),
            deleteCollection: makeRoute({
                route: 'DELETE /v1/collections/:collectionId',
                handler: collectionsController.delete,
                write: true,
            }),
            moveCollection: makeRoute({
                route: 'POST /v1/collections/:collectionId/move',
                handler: collectionsController.move,
                write: true,
            }),
            moveCollections: makeRoute({
                route: 'POST /v1/move-collections',
                handler: collectionsController.moveList,
                write: true,
            }),
            updateCollection: makeRoute({
                route: 'POST /v1/collections/:collectionId/update',
                handler: collectionsController.update,
                write: true,
            }),

            copyEntryToWorkbook: makeRoute({
                route: 'POST /v2/entries/:entryId/copy',
                handler: entriesController.copyEntryToWorkbook,
                write: true,
            }),

            copyEntriesToWorkbook: makeRoute({
                route: 'POST /v2/copy-entries',
                handler: entriesController.copyEntriesToWorkbook,
                write: true,
            }),
        };
    }

    if (isEnabledFeature(ctx, Feature.ColorPalettesEnabled)) {
        routes = {
            ...routes,

            getColorPalettes: makeRoute({
                route: 'GET /v1/color-palettes',
                handler: colorPalettesController.getList,
            }),
            getColorPalette: makeRoute({
                route: 'GET /v1/color-palettes/:colorPaletteId',
                handler: colorPalettesController.get,
                authPolicy: AuthPolicy.disabled,
            }),
            createColorPalette: makeRoute({
                route: 'POST /v1/color-palettes',
                handler: colorPalettesController.create,
                write: true,
            }),
            updateColorPalette: makeRoute({
                route: 'POST /v1/color-palettes/:colorPaletteId/update',
                handler: colorPalettesController.update,
                write: true,
            }),
            deleteColorPalette: makeRoute({
                route: 'DELETE /v1/color-palettes/:colorPaletteId',
                handler: colorPalettesController.delete,
                write: true,
            }),
        };
    }

    return routes;
}
