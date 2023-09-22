export type Operation = {
    id: string;
    description: string;
    createdBy: string;
    createdAt: {
        seconds: string;
        nanos?: number;
    };
    modifiedAt: {
        seconds: string;
        nanos?: number;
    };
    metadata: {};
    done: boolean;
};

export const formatOperation = (operation: Operation) => {
    return {
        id: operation.id,
        description: 'Datalens operation',
        createdBy: '',
        createdAt: operation.createdAt,
        modifiedAt: operation.modifiedAt,
        metadata: {},
        done: operation.done ?? true,
    };
};
