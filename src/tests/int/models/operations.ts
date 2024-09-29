export const OPERATION_DEFAULT_FIELDS = {
    id: expect.any(String),
    description: 'Datalens operation',
    createdBy: '',
    createdAt: {
        nanos: expect.any(Number),
        seconds: expect.any(String),
    },
    modifiedAt: {
        nanos: expect.any(Number),
        seconds: expect.any(String),
    },
    metadata: {},
    done: expect.any(Boolean),
};
