import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE favorites ADD COLUMN display_alias TEXT;
        ALTER TABLE favorites ADD COLUMN sort_alias bytea;

        UPDATE favorites SET display_alias = alias;
        CREATE INDEX favorites_alias_idx ON favorites(alias);

        UPDATE favorites SET sort_alias = naturalsort(alias);
        CREATE INDEX sort_favorites_alias_idx ON favorites(sort_alias);

        CREATE FUNCTION update_favorites() RETURNS trigger AS $$
            BEGIN
                NEW.sort_alias := naturalsort(NEW.alias);
                RETURN NEW;
            END
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER before_favorites_insert_or_update
            BEFORE INSERT OR UPDATE ON favorites
            FOR EACH ROW EXECUTE PROCEDURE update_favorites();
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP TRIGGER before_favorites_insert_or_update on favorites;
        DROP FUNCTION update_favorites();

        DROP INDEX favorites_sort_alias_idx;
        DROP INDEX favorites_alias_idx;

        ALTER TABLE favorites DROP COLUMN sort_alias;
        ALTER TABLE favorites DROP COLUMN display_alias;
    `);
}
