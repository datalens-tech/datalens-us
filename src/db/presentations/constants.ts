export const selectedEntryColumns = [
    'scope',
    'type',
    'key',
    'createdBy',
    'createdAt',
    'updatedAt',
    'updatedBy',
    'publishedId',
    'savedId',
    'hidden',
    'entryId',
    'name',
    'workbookId',
] as const;

export const selectedEntryColumnsForJoin = [
    ...selectedEntryColumns,
    'innerMeta',
    'isDeleted',
    'deletedAt',
    'displayKey',
    'sortName',
    'tenantId',
    'public',
    'unversionedData',
] as const;
