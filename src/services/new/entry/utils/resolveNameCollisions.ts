import Utils from '../../../../utils';

export const resolveEntriesNameCollisions = ({
    existingEntries,
    addingEntries,
}: {
    existingEntries: Array<{entryId: string; displayKey: Nullable<string>}>;
    addingEntries: Array<{entryId: string; displayKey: Nullable<string>}>;
}) => {
    const mapCollisions = new Map<string, number>();

    existingEntries.forEach(({displayKey}) => {
        if (displayKey) {
            const entryName = Utils.getNameByKey({key: displayKey});
            const entryNameWithoutCopy = Utils.getNameWithoutCopyNumber(entryName);
            const preparedEntryName = entryNameWithoutCopy.toLowerCase();
            const copyNameNumber = Utils.getCopyNumber(entryName);

            if (copyNameNumber > 0) {
                mapCollisions.set(
                    preparedEntryName,
                    Math.max(mapCollisions.get(preparedEntryName) ?? 0, copyNameNumber) + 1,
                );
            } else {
                mapCollisions.set(
                    preparedEntryName,
                    (mapCollisions.get(preparedEntryName) ?? 0) + 1,
                );
            }
        }
    });

    const addingNames = new Map<string, string>();

    addingEntries.forEach((entry) => {
        let collisionCount: number;

        const {entryId, displayKey} = entry;

        const entryName = Utils.getNameByKey({key: displayKey});
        const copyNameNumber = Utils.getCopyNumber(entryName);
        const entryNameWithoutCopy = Utils.getNameWithoutCopyNumber(entryName);
        const preparedEntryName = entryNameWithoutCopy.toLowerCase();

        if (copyNameNumber > 0) {
            collisionCount = Math.max(mapCollisions.get(preparedEntryName) ?? 0, copyNameNumber);
        } else {
            collisionCount = mapCollisions.get(preparedEntryName) ?? 0;
        }

        const newEntryName = Utils.setCopyNumber(entryNameWithoutCopy, collisionCount);

        mapCollisions.set(preparedEntryName, collisionCount + 1);

        addingNames.set(entryId, newEntryName);
    });

    return addingNames;
};
