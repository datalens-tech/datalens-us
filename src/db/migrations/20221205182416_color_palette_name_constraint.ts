import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        UPDATE color_palettes SET name = encode_id(color_palette_id), display_name = encode_id(color_palette_id) WHERE TRIM(name) = '';

        ALTER TABLE color_palettes ADD CONSTRAINT color_palettes_non_empty_name_constraint CHECK(TRIM(name) != '');
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE color_palettes DROP CONSTRAINT color_palettes_non_empty_name_constraint;
    `);
}
