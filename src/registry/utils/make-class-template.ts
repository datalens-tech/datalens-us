export const makeClassTemplate = <T extends new (...args: any[]) => unknown>(): T => {
    return class Template {} as T;
};
