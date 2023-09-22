import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE locks DROP CONSTRAINT uniq_active_lock_per_entry_id;

        ALTER TABLE locks 
            ADD CONSTRAINT uniq_active_lock_per_entry_id
            EXCLUDE USING gist (
                entry_id WITH =,
                tstzrange(start_date, expiry_date) WITH &&
            )
            WHERE (expiry_date > start_date);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE locks DROP CONSTRAINT uniq_active_lock_per_entry_id;

        ALTER TABLE locks 
            ADD CONSTRAINT uniq_active_lock_per_entry_id
            EXCLUDE USING gist (
                entry_id WITH =,
                tstzrange(start_date, expiry_date) WITH &&
            )
            WHERE (expiry_date > start_date AND is_new = true);
    `);
}
