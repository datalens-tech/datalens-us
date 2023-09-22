import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        SET LOCAL lock_timeout = '10s';

        ALTER TABLE revisions
            ADD CONSTRAINT revisions_entries_id FOREIGN KEY (entry_id)
                REFERENCES entries(entry_id)
                ON DELETE CASCADE;

        ALTER TABLE favorites
            ADD CONSTRAINT favorites_entries_id FOREIGN KEY (entry_id)
                REFERENCES entries(entry_id)
                ON DELETE CASCADE;

        ALTER TABLE states
            ADD CONSTRAINT states_entries_id FOREIGN KEY (entry_id)
                REFERENCES entries(entry_id)
                ON DELETE CASCADE;

        ALTER TABLE locks
            ADD CONSTRAINT locks_entries_id FOREIGN KEY (entry_id)
                REFERENCES entries(entry_id)
                ON DELETE CASCADE;

        -- ALTER TABLE links
            -- ADD CONSTRAINT links_entries_from_id FOREIGN KEY (from_id)
                -- REFERENCES entries(entry_id)
                -- ON DELETE CASCADE;

        -- ALTER TABLE links
            -- ADD CONSTRAINT links_entries_to_id FOREIGN KEY (to_id)
                -- REFERENCES entries(entry_id)
                -- ON DELETE CASCADE;

        ALTER TABLE entries
            ADD CONSTRAINT entries_tenants_id FOREIGN KEY (tenant_id)
                REFERENCES tenants(tenant_id)
                ON UPDATE CASCADE
                ON DELETE CASCADE;
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        ALTER TABLE revisions
            DROP CONSTRAINT revisions_entries_id;

        ALTER TABLE favorites
            DROP CONSTRAINT favorites_entries_id;

        ALTER TABLE states
            DROP CONSTRAINT states_entries_id;

        ALTER TABLE locks
            DROP CONSTRAINT locks_entries_id;

        -- ALTER TABLE links
            -- DROP CONSTRAINT links_entries_from_id;

        -- ALTER TABLE links
            -- DROP CONSTRAINT links_entries_to_id;

        ALTER TABLE entries
            DROP CONSTRAINT entries_tenants_id;
    `);
};
