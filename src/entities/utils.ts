import {Operation} from './types';

export const getMockedOperation = (id: string): Operation => {
    const [seconds, nanoseconds] = process.hrtime();
    return {
        createdAt: {
            nanos: nanoseconds,
            seconds: seconds.toString(),
        },
        createdBy: '',
        description: 'Datalens operation',
        done: true,
        id: id,
        metadata: {},
        modifiedAt: {
            nanos: nanoseconds,
            seconds: seconds.toString(),
        },
    };
};
