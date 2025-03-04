declare global {
    type Nullable<T> = T | null;

    type NullableValues<T> = {
        [P in keyof T]: T[P] | null;
    };

    type Optional<T> = T | undefined;

    type ArrayElement<ArrayType extends readonly unknown[]> =
        ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

    type ValueOf<T> = T[keyof T];
}

export {};
