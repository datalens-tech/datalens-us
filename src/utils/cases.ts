type SnakeCase<S extends string> = S extends `${infer T}${infer U}`
    ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${SnakeCase<U>}`
    : S;

type MapToSnakeCase<T extends Record<string, string>> = {
    [K in keyof T]: SnakeCase<T[K]>;
};

const toSnakeCase = (str: string): string =>
    str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

export const mapValuesToSnakeCase = <T extends Record<string, string>>(
    obj: T,
): MapToSnakeCase<T> => {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, toSnakeCase(value)]),
    ) as MapToSnakeCase<T>;
};
