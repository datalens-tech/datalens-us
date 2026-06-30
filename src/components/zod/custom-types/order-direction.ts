import {z} from 'zod';

import {OrderBy} from '../../../const';

const ORDER_DIRECTION_TO_ORDER_BY = {
    asc: OrderBy.Asc,
    desc: OrderBy.Desc,
} as const;

export type OrderDirection = keyof typeof ORDER_DIRECTION_TO_ORDER_BY; // 'asc' | 'desc' (wire/input type)

// Parses lowercase wire `asc`/`desc` and transforms to the uppercase `OrderBy` enum the
// DB layer needs; the input enum is unchanged so the OpenAPI contract stays lowercase.
// Bare schema — callers append `.optional()` / `.default(OrderBy.Desc)`.
export const orderDirection = () =>
    z
        .enum(Object.keys(ORDER_DIRECTION_TO_ORDER_BY) as [OrderDirection, ...OrderDirection[]])
        .transform((v) => ORDER_DIRECTION_TO_ORDER_BY[v]);
