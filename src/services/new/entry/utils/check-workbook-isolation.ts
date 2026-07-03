import {WorkbookIsolationInterruptionError} from '../../../../components/errors';
import {ServiceArgs} from '../../types';

type PartialEntry = {
    entryId: string;
    workbookId: string | null;
    collectionId: string | null;
};

type CheckWorkbookIsolationArgs = {
    entry: PartialEntry;
};

export const checkWorkbookIsolation = ({ctx}: ServiceArgs, {entry}: CheckWorkbookIsolationArgs) => {
    const {workbookId: requestWorkbookId} = ctx.get('info');

    if (!requestWorkbookId) {
        return;
    }

    if (entry.collectionId) {
        // Will be checked in the checkCollectionEntry function
        return;
    }

    if (requestWorkbookId !== entry.workbookId) {
        throw new WorkbookIsolationInterruptionError();
    }
};
