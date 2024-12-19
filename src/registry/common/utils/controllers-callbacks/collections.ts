import type {AppContext} from '@gravity-ui/nodekit';

import type {CreateCollectionReqBody} from '../../../../controllers/collections/create';
import type {DeleteCollectionReqParams} from '../../../../controllers/collections/delete';
import type {DeleteCollectionsListReqBody} from '../../../../controllers/collections/deleteList';
import type {
    MoveCollectionReqBody,
    MoveCollectionReqParams,
} from '../../../../controllers/collections/move';
import type {MoveCollectionsListReqBody} from '../../../../controllers/collections/moveList';
import type {
    UpdateCollectionReqBody,
    UpdateCollectionReqParams,
} from '../../../../controllers/collections/update';
import type {CollectionModel} from '../../../../db/models/new/collection';

export type OnCreateCollectionSuccess = (args: {
    ctx: AppContext;
    reqBody: CreateCollectionReqBody;
    collection: CollectionModel;
}) => void;

export type OnCreateCollectionError = (args: {
    ctx: AppContext;
    reqBody: CreateCollectionReqBody;
    error: unknown;
}) => void;

export type OnUpdateCollectionSuccess = (args: {
    ctx: AppContext;
    reqBody: UpdateCollectionReqBody;
    reqParams: UpdateCollectionReqParams;
    collection: CollectionModel;
}) => void;

export type OnUpdateCollectionError = (args: {
    ctx: AppContext;
    reqBody: UpdateCollectionReqBody;
    reqParams: UpdateCollectionReqParams;
    error: unknown;
}) => void;

export type OnMoveCollectionSuccess = (args: {
    ctx: AppContext;
    reqBody: MoveCollectionReqBody;
    reqParams: MoveCollectionReqParams;
    collection: CollectionModel;
}) => void;

export type OnMoveCollectionError = (args: {
    ctx: AppContext;
    reqBody: MoveCollectionReqBody;
    reqParams: MoveCollectionReqParams;
    error: unknown;
}) => void;

export type OnMoveCollectionsListSuccess = (args: {
    ctx: AppContext;
    reqBody: MoveCollectionsListReqBody;
    collections: CollectionModel[];
}) => void;

export type OnMoveCollectionsListError = (args: {
    ctx: AppContext;
    reqBody: MoveCollectionsListReqBody;
    error: unknown;
}) => void;

export type OnDeleteCollectionSuccess = (args: {
    ctx: AppContext;
    reqParams: DeleteCollectionReqParams;
    collections: CollectionModel[];
}) => void;

export type OnDeleteCollectionError = (args: {
    ctx: AppContext;
    reqParams: DeleteCollectionReqParams;
    error: unknown;
}) => void;

export type OnDeleteCollectionsListSuccess = (args: {
    ctx: AppContext;
    reqBody: DeleteCollectionsListReqBody;
    collections: CollectionModel[];
}) => void;

export type OnDeleteCollectionsListError = (args: {
    ctx: AppContext;
    reqBody: DeleteCollectionsListReqBody;
    error: unknown;
}) => void;
