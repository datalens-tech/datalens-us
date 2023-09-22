export const makeFunctionTemplate = <T extends (...args: any[]) => unknown>(): T => {
    return (() => {}) as T;
};
