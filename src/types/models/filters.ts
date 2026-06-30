export interface EntriesFilters {
    name?: string;
}
// `TDirection` lets each caller say how its direction is typed: old code uses the raw
// 'asc' | 'desc' strings (the default), new Zod code passes the `OrderBy` enum instead.
export interface EntriesOrderByFilter<TField = string, TDirection = 'asc' | 'desc'> {
    field: TField;
    direction: TDirection;
}
