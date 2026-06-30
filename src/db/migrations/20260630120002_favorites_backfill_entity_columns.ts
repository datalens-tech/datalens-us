import type {Knex} from 'knex';

const BATCH_SIZE = 5000;

export async function up(knex: Knex): Promise<void> {
    let updatedRows = 0;

    do {
        const result = await knex.raw(
            `UPDATE favorites
                SET entity_id = entry_id, entity_type = 'entry'
                WHERE (entry_id, login) IN (
                    SELECT entry_id, login FROM favorites
                    WHERE entity_id IS NULL
                    LIMIT ?
                )`,
            [BATCH_SIZE],
        );

        updatedRows = result.rowCount ?? 0;
    } while (updatedRows > 0);
}

export async function down(): Promise<void> {}

export const config = {
    transaction: false,
};
