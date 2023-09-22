export const testDbConfig = {
    user: 'test',
    password: 'test',
    dbName: 'test_us_ci_purgeable',
};

export const getTestDsnList = ({host, port}: {host: string; port: string}) => {
    return `postgres://${testDbConfig.user}:${testDbConfig.password}@${host}:${port}/${testDbConfig.dbName}`;
};
