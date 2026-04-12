export const swapKeysAndValues = <T extends Record<string, string>>(obj: T) => {
    const result = {} as Record<string, string>;
    Object.entries(obj).forEach(([key, value]) => {
        result[value] = key;
    });
    return result as {[K in keyof T as T[K]]: K};
};
