export interface RequestedBy {
    userId: string;
    login: string;
}

export interface BasicRequestParams {
    requestId?: string;
    dlContext?: string;
    onlyPublic?: boolean;
    tenantId?: string;
    isPrivateRoute?: boolean;
    requestedBy: RequestedBy;
}

export type ReturningColumns = string | string[];
