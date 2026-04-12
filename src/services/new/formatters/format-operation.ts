import {Operation} from '../../../entities/types';

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
        ...(operation.response ? {response: operation.response} : {}),
        ...(operation.error ? {error: operation.error} : {}),
    };
};
