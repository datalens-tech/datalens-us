import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE collections ADD COLUMN sort_title bytea;
        UPDATE collections SET sort_title = naturalsort(title);
        ALTER TABLE collections ALTER COLUMN sort_title SET NOT NULL;
        CREATE INDEX collections_sort_title_idx ON collections(sort_title);

        CREATE FUNCTION update_collections() RETURNS trigger AS $$
            BEGIN
                NEW.sort_title := naturalsort(NEW.title);
                RETURN NEW;
            END
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER before_collections_insert_or_update
            BEFORE INSERT OR UPDATE ON collections
            FOR EACH ROW EXECUTE PROCEDURE update_collections();

        ALTER TABLE workbooks ADD COLUMN sort_title bytea;
        UPDATE workbooks SET sort_title = naturalsort(title);
        ALTER TABLE workbooks ALTER COLUMN sort_title SET NOT NULL;
        CREATE INDEX workbooks_sort_title_idx ON workbooks(sort_title);

        CREATE FUNCTION update_workbooks() RETURNS trigger AS $$
            BEGIN
                NEW.sort_title := naturalsort(NEW.title);
                RETURN NEW;
            END
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER before_workbooks_insert_or_update
            BEFORE INSERT OR UPDATE ON workbooks
            FOR EACH ROW EXECUTE PROCEDURE update_workbooks();
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP TRIGGER before_workbooks_insert_or_update ON workbooks;
        DROP FUNCTION update_workbooks();

        DROP INDEX workbooks_sort_title_idx;
        ALTER TABLE workbooks DROP COLUMN sort_title;

        DROP TRIGGER before_collections_insert_or_update ON collections;
        DROP FUNCTION update_collections();

        DROP INDEX collections_sort_title_idx;
        ALTER TABLE collections DROP COLUMN sort_title;
    `);
}
