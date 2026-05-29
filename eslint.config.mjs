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
    {
        rules: {
            'no-restricted-imports': [
                'warn',
                {
                    paths: [
                        {
                            name: 'objection',
                            importNames: ['transaction'],
                            message: 'Use a typed transaction wrapper instead.',
                        },
                    ],
                },
            ],
            'no-restricted-syntax': [
                'warn',
                'WithStatement',
                {
                    selector:
                        'CallExpression[callee.type="MemberExpression"][callee.object.type="Identifier"][callee.object.name=/^[A-Z]/][callee.property.name="query"][arguments.length>0]',
                    message:
                        'Use queryPrimary() or queryReplica() instead of direct .query() calls.',
                },
            ],
        },
    },
];
