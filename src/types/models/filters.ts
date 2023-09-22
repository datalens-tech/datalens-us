export interface EntriesFilters {
    name?: string;
}
export interface EntriesOrderByFilter<TField = string> {
    field: TField;
    direction: 'asc' | 'desc';
}
