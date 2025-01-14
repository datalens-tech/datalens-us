import type {CollectionInstance} from '../../../../registry/common/entities/collection/types';
import {isWorkbookInstance} from '../../../../registry/common/entities/structure-item/types';
import {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';
import {formatCollection} from '../../collection/formatters/format-collection';
import {formatWorkbook} from '../../workbook/formatters';

export const formatStructureItems = ({
    items,
    nextPageToken,
}: {
    items: (CollectionInstance | WorkbookInstance)[];
    nextPageToken: Nullable<string>;
}) => {
    return {
        items: items.map((structureItem: CollectionInstance | WorkbookInstance) =>
            isWorkbookInstance(structureItem)
                ? formatWorkbook(structureItem)
                : formatCollection(structureItem),
        ),
        nextPageToken,
    };
};
