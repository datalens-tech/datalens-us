export const selectedEntryColumns = [
    'scope',
    'type',
    'createdBy',
    'createdAt',
    'updatedAt',
    'updatedBy',
    'publishedId',
    'savedId',
    'hidden',
    'entryId',
    'workbookId',
] as const;

export const selectedEntryColumnsForJoin = [
    ...selectedEntryColumns,
    'innerMeta',
    'key',
    'isDeleted',
    'deletedAt',
    'displayKey',
    'sortName',
    'name',
    'tenantId',
    'public',
    'unversionedData',
] as const;
