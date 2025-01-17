import {makeClassTemplate} from '../utils/make-class-template';

import type {DLSConstructor} from './components/dls/types';
import type {CollectionConstructor} from './entities/collection/types';
import type {WorkbookConstructor} from './entities/workbook/types';

export const commonClassesMap = {
    DLS: makeClassTemplate<DLSConstructor>(),
    Workbook: makeClassTemplate<WorkbookConstructor>(),
    Collection: makeClassTemplate<CollectionConstructor>(),
} as const;
