'use strict';

exports.up = async (knex: any) => {
    await knex.raw("ALTER TYPE scope ADD VALUE 'dash';");
    await knex.raw("ALTER TYPE scope ADD VALUE 'connection';");
    return knex.raw("ALTER TYPE scope ADD VALUE 'widget';");
};

// Stub for correct rollback
exports.down = (knex: any) => knex.raw('SELECT 1 + 1;');

exports.config = {
    transaction: false,
};
