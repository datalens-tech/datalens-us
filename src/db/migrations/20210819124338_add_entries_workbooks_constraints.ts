import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE entries
            ADD CONSTRAINT entries_workbook_id_ref FOREIGN KEY (workbook_id) REFERENCES workbooks(workbook_id) ON DELETE CASCADE;

        ALTER TABLE entries
            ADD CONSTRAINT uniq_scope_name_workbook_id UNIQUE(scope, name, workbook_id);
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE entries DROP CONSTRAINT entries_workbook_id_ref;

        ALTER TABLE entries DROP CONSTRAINT uniq_scope_name_workbook_id;
    `);
};
