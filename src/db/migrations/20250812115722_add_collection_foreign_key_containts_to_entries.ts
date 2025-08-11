import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE entries
            ADD CONSTRAINT entries_collection_id_ref FOREIGN KEY (collection_id)
                REFERENCES collections(collection_id) ON DELETE CASCADE NOT VALID;
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE entries DROP CONSTRAINT entries_collection_id_ref;
    `);
}
