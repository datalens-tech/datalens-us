type ObjectKeys<T extends object> = `${Exclude<keyof T, symbol>}`;

export const objectKeys = Object.keys as <T extends object>(value: T) => Array<ObjectKeys<T>>;

export function absurd(impossible: never): never {
    throw new TypeError(`Static assert has failed with this value: ${impossible}`);
}

export function asTupleValues<R extends Record<string, unknown>, T extends readonly R[keyof R][]>(
    _obj: R,
    arr: T[number] extends R[keyof R] ? (R[keyof R] extends T[number] ? T : never) : never,
): T {
    return arr as T;
}
