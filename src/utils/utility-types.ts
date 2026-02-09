type ObjectKeys<T extends object> = `${Exclude<keyof T, symbol>}`;

export const objectKeys = Object.keys as <T extends object>(value: T) => Array<ObjectKeys<T>>;

export function absurd(impossible: never): never {
    throw new TypeError(`Static assert has failed with this value: ${impossible}`);
}
