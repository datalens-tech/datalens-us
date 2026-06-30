import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE data_exports
            DROP CONSTRAINT data_exports_chart_id_fkey,
            DROP CONSTRAINT data_exports_chart_rev_id_fkey,
            DROP CONSTRAINT data_exports_dataset_id_fkey,
            DROP CONSTRAINT data_exports_dataset_rev_id_fkey,
            DROP CONSTRAINT data_exports_connection_id_fkey,
            DROP CONSTRAINT data_exports_connection_rev_id_fkey;

        ALTER TABLE subscriptions
            DROP CONSTRAINT subscriptions_trigger_entry_id_fkey;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE subscriptions
            ADD CONSTRAINT subscriptions_trigger_entry_id_fkey FOREIGN KEY (trigger_entry_id) REFERENCES entries (entry_id) ON UPDATE CASCADE ON DELETE SET NULL;

        ALTER TABLE data_exports
            ADD CONSTRAINT data_exports_chart_id_fkey FOREIGN KEY (chart_id) REFERENCES entries (entry_id) ON UPDATE CASCADE ON DELETE SET NULL,
            ADD CONSTRAINT data_exports_chart_rev_id_fkey FOREIGN KEY (chart_rev_id) REFERENCES revisions (rev_id) ON UPDATE CASCADE ON DELETE SET NULL,
            ADD CONSTRAINT data_exports_dataset_id_fkey FOREIGN KEY (dataset_id) REFERENCES entries (entry_id) ON UPDATE CASCADE ON DELETE SET NULL,
            ADD CONSTRAINT data_exports_dataset_rev_id_fkey FOREIGN KEY (dataset_rev_id) REFERENCES revisions (rev_id) ON UPDATE CASCADE ON DELETE SET NULL,
            ADD CONSTRAINT data_exports_connection_id_fkey FOREIGN KEY (connection_id) REFERENCES entries (entry_id) ON UPDATE CASCADE ON DELETE SET NULL,
            ADD CONSTRAINT data_exports_connection_rev_id_fkey FOREIGN KEY (connection_rev_id) REFERENCES revisions (rev_id) ON UPDATE CASCADE ON DELETE SET NULL;
    `);
}
