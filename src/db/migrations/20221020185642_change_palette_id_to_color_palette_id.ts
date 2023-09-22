import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
       ALTER TABLE color_palettes RENAME COLUMN palette_id TO color_palette_id;
   `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
       ALTER TABLE color_palettes RENAME COLUMN color_palette_id TO palette_id;
    `);
}
