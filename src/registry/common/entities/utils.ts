export const getMockedOperation = (id: string) => {
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
