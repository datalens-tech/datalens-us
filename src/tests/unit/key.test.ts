import {KEY_REG} from '../../components/validation-schema-compiler';

const permittedKeys = [
    'u/',
    '1/',
    'users/',
    'users/username/',
    'users/username/file',
    'users/username/folder/',
    'users/username/файл/',
    'users/username/папка/',
    'users/username/folder с пробелами/',
    'users/username/_folder_с_подчеркиванием_____/',
    'users/username/folder с символами .,: _-–—−@$*& середине/',
    'users/username/@folder с символами в конце и в начале @/',
    'users/username/folder с круглыми скобками (скобки)/',
];

[
    '\u00A0',
    '\u180E',
    '\u2000',
    '\u2001',
    '\u2002',
    '\u2003',
    '\u2004',
    '\u2005',
    '\u2006',
    '\u2007',
    '\u2008',
    '\u2009',
    '\u200A',
    '\u200B',
    '\u202F',
    '\u205F',
    '\u3000',
    '\uFEFF',
].forEach((spaceChar) => {
    permittedKeys.push(`start${spaceChar}end`);
});

const forbiddenKeys = [
    'users/username/folder с квадратными скобками [скобки]/',
    'users/username/folder с символами ?!/',
    'users/username/folder с символами $/',
    '1-',
    '-1',
    '\u00A0key',
    'key\u00A0',
];

describe('Keys validator', () => {
    test('Check permitted keys', () => {
        permittedKeys.forEach((key) => {
            const isPermitted = key
                .split('/')
                .filter((part) => part)
                .every((part): boolean => KEY_REG.test(part));

            if (!isPermitted) {
                console.log(key);
            }

            expect(isPermitted).toBeTruthy();
        });
    });

    test('Check forbidden keys', () => {
        forbiddenKeys.forEach((key) => {
            const isPermitted = key
                .split('/')
                .filter((part) => part)
                .every((part): boolean => KEY_REG.test(part));

            if (isPermitted) {
                console.log(key);
            }

            expect(isPermitted).toBeFalsy();
        });
    });
});
