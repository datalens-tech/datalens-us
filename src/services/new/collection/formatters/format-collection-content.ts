import type {CollectionInstance} from '../../../../registry/common/entities/collection/types';
import type {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';
import {formatWorkbook} from '../../workbook/formatters';
import {formatCollection} from './format-collection';

export const formatCollectionContent = ({
    collections,
    collectionsNextPageToken,
    workbooks,
    workbooksNextPageToken,
}: {
    collections: CollectionInstance[];
    collectionsNextPageToken: Nullable<string>;
    workbooks: WorkbookInstance[];
    workbooksNextPageToken: Nullable<string>;
}) => {
    return {
        collections: collections.map(formatCollection),
        collectionsNextPageToken,
        workbooks: workbooks.map(formatWorkbook),
        workbooksNextPageToken,
    };
};
