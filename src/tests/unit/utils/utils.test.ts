import Utils from '../../../utils';

describe('Utils', () => {
    describe('Utils.getCopyNumber', () => {
        test('Shoud return 0 if name does not have prefix COPY', () => {
            const name = 'DASH';
            const copyNameNumber = Utils.getCopyNumber(name);

            expect(copyNameNumber).toBe(0);
        });

        test('Shoud return number if name has prefix COPY', () => {
            const name = 'DASH (COPY 7)';
            const copyNameNumber = Utils.getCopyNumber(name);

            expect(copyNameNumber).toBe(7);
        });
    });

    describe('Utils.setCopyNumber', () => {
        test('Shoud return name without prefix COPY, if count === 0', () => {
            const name = 'DASH';
            const replacedCopyNumber = Utils.setCopyNumber(name, 0);

            expect(replacedCopyNumber).toBe('DASH');
        });

        test('Shoud increment counter if name has prefix COPY', () => {
            const name = 'DASH';
            const replacedCopyNumber = Utils.setCopyNumber(name, 1);

            expect(replacedCopyNumber).toBe('DASH (COPY 1)');
        });
    });

    describe('Utils.getNameWithoutCopyNumber', () => {
        test('Shoud return name without prefix, if name has prefix', () => {
            const nameWithoutCopy = Utils.getNameWithoutCopyNumber('DASH (COPY 7)');

            expect(nameWithoutCopy).toBe('DASH');
        });

        test('Shoud return name without prefix, if name has not prefix', () => {
            const nameWithoutCopy = Utils.getNameWithoutCopyNumber('DASH');

            expect(nameWithoutCopy).toBe('DASH');
        });
    });

    describe('Utils.getFullParentFolderKeys', () => {
        test('Shoud return all full parent folder keys', () => {
            const parentFolderKeys = Utils.getFullParentFolderKeys(
                'foldername/nestedfolder/nestedfolder2/nestedfolder3',
            );

            expect(parentFolderKeys).toEqual([
                'foldername/nestedfolder/nestedfolder2/',
                'foldername/nestedfolder/',
                'foldername/',
            ]);
        });

        test('Shoud return parent folder, if the entity does not have / at the end ', () => {
            const parentFolderKeys = Utils.getFullParentFolderKeys('entries-basic-tests/dataset');

            expect(parentFolderKeys).toEqual(['entries-basic-tests/']);
        });

        test('Shoud return /, if no parent folder', () => {
            const parentFolderKeys = Utils.getFullParentFolderKeys('foldername');

            expect(parentFolderKeys).toEqual(['/']);
        });

        test('Shoud return root folder, when only / in input', () => {
            const parentFolderKeys = Utils.getFullParentFolderKeys('/');

            expect(parentFolderKeys).toEqual(['/']);
        });

        test('Shoud return root folder, when only 1 entity in string', () => {
            const parentFolderKeys = Utils.getFullParentFolderKeys('foldername/');

            expect(parentFolderKeys).toEqual(['/']);
        });

        test('Shoud return empty array, when input empty string', () => {
            const parentFolderKeys = Utils.getFullParentFolderKeys('');

            expect(parentFolderKeys).toEqual([]);
        });
    });
});
