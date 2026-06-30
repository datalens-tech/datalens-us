import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE OR REPLACE FUNCTION update_favorites() RETURNS trigger AS $$
            BEGIN
                NEW.sort_alias := naturalsort(NEW.alias);
                IF NEW.entity_id IS NULL THEN
                    NEW.entity_id := NEW.entry_id;
                END IF;
                IF NEW.entity_type IS NULL THEN
                    NEW.entity_type := 'entry';
                END IF;
                RETURN NEW;
            END
        $$ LANGUAGE plpgsql;
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        CREATE OR REPLACE FUNCTION update_favorites() RETURNS trigger AS $$
            BEGIN
                NEW.sort_alias := naturalsort(NEW.alias);
                RETURN NEW;
            END
        $$ LANGUAGE plpgsql;
    `);
}
