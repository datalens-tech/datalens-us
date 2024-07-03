import {EmbedModel} from '../db/models/new/embed';
import {JoinedEntryRevisionColumns} from '../db/presentations/joined-entry-revision';
import {EmbeddingToken} from '../types/embedding';
import {PrivatePermissions} from './models';
import {ZitadelServiceUser, ZitadelUserRole} from './zitadel';

export type UserCtxInfo = {
    userId: string;
    login: string;
};

export type EmbeddingInfo = {
    token: EmbeddingToken;
    embed: EmbedModel;
    entry: JoinedEntryRevisionColumns;
};

export type CtxInfo = {
    requestId: string;
    tenantId: string;
    workbookId?: string;
    user: UserCtxInfo;
    isPrivateRoute: boolean;
    dlContext: string;
    onlyPublic: boolean;
    onlyMirrored?: boolean;
    privatePermissions: PrivatePermissions;
    projectId: string | null;
    embeddingInfo?: EmbeddingInfo;
    serviceUser?: ZitadelServiceUser;
    zitadelUserRole: ZitadelUserRole;
};
