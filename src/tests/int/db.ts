export const testDbConfig = {
    user: 'test',
    password: 'test',
    port: 5432,
    dbName: 'int-testing_us_ci_purgeable',
};

export const getTestDsn = (dbName: string): string => {
    const globals = global as unknown as Record<string, string>;
    const host = globals['__TESTCONTAINERS_POSTGRE_IP__'];
    const port = globals[`__TESTCONTAINERS_POSTGRE_PORT_${testDbConfig.port}__`];
    return `postgres://${testDbConfig.user}:${testDbConfig.password}@${host}:${port}/${dbName}`;
};

export const getTestDsnList = () => getTestDsn(testDbConfig.dbName);

export const assertDbName = (dsnList: string, expectedName: string) => {
    const actual = new URL(dsnList).pathname.slice(1);
    if (actual !== expectedName) {
        throw new Error(
            `Database for tests should be named \`${expectedName}\`, got \`${actual}\``,
        );
    }
};
