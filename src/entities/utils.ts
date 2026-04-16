import {Operation} from './types';

export const getMockedOperation = ({
    id,
    done = true,
    response,
}: {
    id: Operation['id'];
    done?: Operation['done'];
    response?: Operation['response'];
}): Operation => {
    const [seconds, nanoseconds] = process.hrtime();
    return {
        createdAt: {
            nanos: nanoseconds,
            seconds: seconds.toString(),
        },
        createdBy: '',
        description: 'Datalens operation',
        done,
        id: id,
        metadata: {},
        modifiedAt: {
            nanos: nanoseconds,
            seconds: seconds.toString(),
        },
        ...(response ? {response} : {}),
    };
};
