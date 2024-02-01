import {CTX} from './core';

export interface TemplateData {
    templatePath: string;
    connectionId?: string;
    defaultTargetPath?: string;
    workbookId?: string;
}

export interface GetAllTemplate {
    ctx: CTX;
}
export interface GetTemplate {
    ctx: CTX;
    name: string;
}
export interface CreateTemplate {
    ctx: CTX;
    name: string;
    data: TemplateData;
}
export interface UpdateTemplate {
    ctx: CTX;
    name: string;
    data: TemplateData;
}
export interface DeleteTemplate {
    ctx: CTX;
    name: string;
}
