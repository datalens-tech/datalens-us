export {CollectionRole, CollectionPermission} from './collection/types';
export {WorkbookRole, WorkbookPermission} from './workbook/types';

export enum ResourceType {
    Collection = 'datalens.collection',
    Workbook = 'datalens.workbook',
}

export type Operation = {
    createdAt: {
        nanos?: number;
        seconds: string;
    };
    createdBy: string;
    description: string;
    done: boolean;
    id: string;
    metadata: Object;
    modifiedAt: {
        nanos?: number;
        seconds: string;
    };
};
