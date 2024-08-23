import type {CollectionInstance} from '../../../../registry/common/entities/collection/types';
import {isWorkbookInstance} from '../../../../registry/common/entities/structure-item/types';
import {formatCollection} from '../../collection/formatters';
import {formatWorkbook} from '../../workbook/formatters';
import {WorkbookInstance} from '../../../../registry/common/entities/workbook/types';

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
