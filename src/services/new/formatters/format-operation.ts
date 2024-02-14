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
    description?: string;
    createdBy?: string;
    createdAt: {
        seconds: string | number;
        nanos?: number;
    };
    modifiedAt: {
        seconds: string | number;
        nanos?: number;
    };
    metadata?: {};
    done: boolean;
    result?: ResultError | ResultResponse;
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
        ...(operation.result ? {result: operation.result} : {}),
    };
};
