import mainConfig from '@gravity-ui/eslint-config';
import importOrderConfig from '@gravity-ui/eslint-config/import-order';
import prettierConfig from '@gravity-ui/eslint-config/prettier';
import globals from 'globals';

export default [
    {ignores: ['dist/**', 'jest/**', 'scripts/**', 'node_modules/**']},
    ...mainConfig,
    ...prettierConfig,
    ...importOrderConfig,
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
    },
];
