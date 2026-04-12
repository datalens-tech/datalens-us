export {CollectionRole, CollectionPermission} from './collection/types';
export {WorkbookRole, WorkbookPermission} from './workbook/types';

export enum ResourceType {
    Collection = 'datalens.collection',
    Workbook = 'datalens.workbook',
    SharedEntry = 'datalens.sharedEntry',
}

interface OperationError {
    code: number;
    details: any;
    message?: string;
}

type ResultError = {
    error?: {
        code: number;
        message: string;
    };
};

type ResultResponse = {
    response?: any;
};

export type Operation = {
    id: string;
    done: boolean;
    createdAt: {
        nanos?: number;
        seconds: string | number;
    };
    modifiedAt: {
        seconds: string | number;
        nanos?: number;
    };
    createdBy?: string;
    description?: string;
    metadata?: Object;
    result?: ResultError | ResultResponse;
    response?: any;
    error?: OperationError;
};
