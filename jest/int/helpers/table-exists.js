module.exports = async (knex, table = 'migrations') => {
    const result = await knex.raw(
        `
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = ?
            );
        `,
        [table],
    );

    return result.rows[0].exists;
};
