import request from 'supertest';

import {routes} from '../../routes';

import {AuthArgs, app, auth, authMasterToken, testTenantId} from './auth';
import {OpensourceRole} from './roles';

export const mockWorkbookEntry = {
    name: 'Entry Name',
    scope: 'widget',
    type: 'graph_wizard_node',
    data: null,
    meta: null,
    mode: undefined,
};

type OptionsArgs = {
    authArgs?: AuthArgs;
};

type CreateMockWorkbookEntryArgs = {
    name?: string;
    scope?: string;
    type?: string;
    workbookId: string;
    meta?: Record<string, string>;
    data?: Record<string, string | boolean>;
    mode?: 'save' | 'publish';
};

export const createMockWorkbookEntry = async (
    args: CreateMockWorkbookEntryArgs,
    options?: OptionsArgs,
) => {
    const name = args.name ?? mockWorkbookEntry.name;
    const scope = args.scope ?? mockWorkbookEntry.scope;
    const type = args.type ?? mockWorkbookEntry.type;
    const workbookId = args.workbookId;
    const data = args.data ?? mockWorkbookEntry.data;
    const meta = args.meta ?? mockWorkbookEntry.meta;
    const mode = args.mode ?? mockWorkbookEntry.mode;

    const response = await auth(request(app).post(routes.entries), {
        ...options?.authArgs,
        role: OpensourceRole.Editor,
    })
        .send({
            name,
            scope,
            type,
            data,
            meta,
            workbookId,
            mode,
        })
        .expect(200);

    return response.body;
};

export const createPrivateMockWorkbookEntry = async (args: CreateMockWorkbookEntryArgs) => {
    const name = args.name ?? mockWorkbookEntry.name;
    const scope = args.scope ?? mockWorkbookEntry.scope;
    const type = args.type ?? mockWorkbookEntry.type;
    const workbookId = args.workbookId;
    const data = args.data ?? mockWorkbookEntry.data;
    const meta = args.meta ?? mockWorkbookEntry.meta;
    const mode = args.mode ?? mockWorkbookEntry.mode;

    const response = await authMasterToken(request(app).post(routes.privateCreateEntry))
        .send({
            name,
            scope,
            type,
            data,
            meta,
            workbookId,
            mode,
        })
        .expect(200);

    return response.body;
};

export const mockCollection = {
    title: 'Collection title',
    parentId: null,
};

export const createMockCollection = async (
    args: {
        title?: string;
        description?: string;
        parentId: string | null;
    },
    options?: OptionsArgs,
) => {
    const title = args.title ?? mockCollection.title;
    const description = args.description;
    const parentId = args.parentId ?? mockCollection.parentId;

    const response = await auth(request(app).post(routes.collections), {
        ...options?.authArgs,
        role: OpensourceRole.Editor,
    })
        .send({
            title: title ?? mockCollection.title,
            description: description,
            parentId: parentId ?? mockCollection.parentId,
        })
        .expect(200);

    return response.body;
};

export const deleteMockCollection = (
    {
        collectionId,
    }: {
        collectionId: string;
    },
    options?: OptionsArgs,
) => {
    return auth(request(app).delete(`${routes.collections}/${collectionId}`), {
        ...options?.authArgs,
        role: OpensourceRole.Editor,
    }).expect(200);
};

export const mockWorkbook = {
    title: 'Workbook title',
    collectionId: null,
    tenantId: testTenantId,
};

export const createMockWorkbook = async (
    args: {
        title?: string;
        description?: string;
        collectionId?: string | null;
    } = {},
    options?: OptionsArgs,
) => {
    const title = args.title ?? mockWorkbook.title;
    const description = args.description;
    const collectionId = args.collectionId ?? mockWorkbook.collectionId;

    const response = await auth(request(app).post(routes.workbooks), {
        ...options?.authArgs,
        role: OpensourceRole.Editor,
    })
        .send({
            title,
            description,
            collectionId,
        })
        .expect(200);

    return response.body;
};

export const getMockWorkbook = async (
    {
        workbookId,
    }: {
        workbookId: string;
    },
    options?: OptionsArgs,
) => {
    const response = await auth(request(app).get(`${routes.workbooks}/${workbookId}`), {
        ...options?.authArgs,
    }).expect(200);

    return response.body;
};

export const deleteMockWorkbook = (
    {
        workbookId,
    }: {
        workbookId: string;
    },
    options?: OptionsArgs,
) => {
    return auth(request(app).delete(`${routes.workbooks}/${workbookId}`), {
        ...options?.authArgs,
        role: OpensourceRole.Editor,
    }).expect(200);
};
