import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE workbooks ADD COLUMN title_uniq TEXT;

        UPDATE workbooks SET title_uniq = concat(tenant_id, '/', lower(title))
            WHERE project_id IS NULL;

        UPDATE workbooks SET title_uniq = concat(project_id, '/', lower(title))
            WHERE project_id IS NOT NULL;

        ALTER TABLE workbooks ADD CONSTRAINT title_uniq_constraint UNIQUE(title_uniq);

        ALTER TABLE workbooks ALTER COLUMN title_uniq SET NOT NULL;
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE workbooks
            DROP CONSTRAINT title_uniq_constraint;

        ALTER TABLE workbooks DROP COLUMN title_uniq;
    `);
};
