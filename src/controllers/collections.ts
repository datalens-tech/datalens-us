import {Request, Response} from '@gravity-ui/expresskit';
import prepareResponse from '../components/response-presenter';
import Utils from '../utils';
import {
    createCollection,
    deleteCollection,
    getCollection,
    getCollectionContent,
    getRootCollectionPermissions,
    getCollectionBreadcrumbs,
    moveCollection,
    moveCollectionsList,
    updateCollection,
    OrderField,
    OrderDirection,
    Mode,
} from '../services/new/collection';
import {
    formatCollectionModel,
    formatCollectionModelsList,
    formatCollection,
    formatGetCollectionBreadcrumbs,
    formatCollectionContent,
    formatCollectionWithOperation,
} from '../services/new/collection/formatters';

export default {
    create: async (req: Request, res: Response) => {
        const {body} = req;

        const result = await createCollection(
            {ctx: req.ctx},
            {
                title: body.title,
                description: body.description as Optional<string>,
                parentId: body.parentId as Nullable<string>,
            },
        );

        const formattedResponse = formatCollectionWithOperation(
            result.collection,
            result.operation,
        );

        const {code, response} = prepareResponse({data: formattedResponse});

        res.status(code).send(response);
    },

    get: async (req: Request, res: Response) => {
        const {params, query} = req;

        const result = await getCollection(
            {ctx: req.ctx},
            {
                collectionId: params.collectionId,
                includePermissionsInfo: Utils.isTrueArg(query.includePermissionsInfo),
            },
        );

        const formattedResponse = formatCollection(result);

        const {code, response} = prepareResponse({data: formattedResponse});

        res.status(code).send(response);
    },

    getContent: async (req: Request, res: Response) => {
        const {query} = req;

        let collectionsPage: Optional<Nullable<number>>;
        if (query.collectionsPage === 'null') {
            collectionsPage = null;
        } else {
            collectionsPage = query.collectionsPage
                ? parseInt(query.collectionsPage as string, 10)
                : undefined;
        }

        let workbooksPage: Optional<Nullable<number>>;
        if (query.workbooksPage === 'null') {
            workbooksPage = null;
        } else {
            workbooksPage = query.workbooksPage
                ? parseInt(query.workbooksPage as string, 10)
                : undefined;
        }

        const result = await getCollectionContent(
            {ctx: req.ctx},
            {
                collectionId: (query.collectionId as Optional<string>) ?? null,
                includePermissionsInfo: Utils.isTrueArg(query.includePermissionsInfo),
                filterString: query.filterString as Optional<string>,
                collectionsPage,
                workbooksPage,
                pageSize: query.pageSize ? parseInt(query.pageSize as string, 10) : undefined,
                orderField: query.orderField as Optional<OrderField>,
                orderDirection: query.orderDirection as Optional<OrderDirection>,
                onlyMy: Utils.isTrueArg(query.onlyMy),
                mode: query.mode as Optional<Mode>,
            },
        );

        const formattedResponse = formatCollectionContent(result);

        const {code, response} = prepareResponse({data: formattedResponse});

        res.status(code).send(response);
    },

    getRootPermissions: async (req: Request, res: Response) => {
        const result = await getRootCollectionPermissions({ctx: req.ctx});

        const {code, response} = prepareResponse({data: result});

        res.status(code).send(response);
    },

    getBreadcrumbs: async (req: Request, res: Response) => {
        const {params, query} = req;

        const result = await getCollectionBreadcrumbs(
            {ctx: req.ctx},
            {
                collectionId: params.collectionId,
                includePermissionsInfo: Utils.isTrueArg(query.includePermissionsInfo),
            },
        );

        const formattedResponse = formatGetCollectionBreadcrumbs(result);

        const {code, response} = prepareResponse({data: formattedResponse});

        res.status(code).send(response);
    },

    delete: async (req: Request, res: Response) => {
        const {params} = req;

        const result = await deleteCollection(
            {ctx: req.ctx},
            {
                collectionId: params.collectionId,
            },
        );

        const formattedResponse = formatCollectionModelsList(result);

        const {code, response} = prepareResponse({data: formattedResponse});

        res.status(code).send(response);
    },

    move: async (req: Request, res: Response) => {
        const {params, body} = req;

        const result = await moveCollection(
            {ctx: req.ctx},
            {
                collectionId: params.collectionId,
                parentId: body.parentId as string,
                title: body.title as Optional<string>,
            },
        );

        const formattedResponse = formatCollectionModel(result);

        const {code, response} = prepareResponse({data: formattedResponse});

        res.status(code).send(response);
    },

    moveList: async (req: Request, res: Response) => {
        const {body} = req;

        const result = await moveCollectionsList(
            {ctx: req.ctx},
            {
                collectionIds: body.collectionIds,
                parentId: body.parentId as string,
            },
        );

        const formattedResponse = formatCollectionModelsList(result);

        const {code, response} = prepareResponse({data: formattedResponse});

        res.status(code).send(response);
    },
    update: async (req: Request, res: Response) => {
        const {params, body} = req;

        const result = await updateCollection(
            {ctx: req.ctx},
            {
                collectionId: params.collectionId,
                title: body.title as Optional<string>,
                description: body.description as Optional<string>,
            },
        );

        const formattedResponse = formatCollectionModel(result);

        const {code, response} = prepareResponse({data: formattedResponse});

        res.status(code).send(response);
    },
};
