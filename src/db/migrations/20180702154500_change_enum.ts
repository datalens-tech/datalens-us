'use strict';

exports.up = async (knex: any) => {
    await knex.raw("ALTER TYPE scope ADD VALUE 'dash';");
    await knex.raw("ALTER TYPE scope ADD VALUE 'connection';");
    return knex.raw("ALTER TYPE scope ADD VALUE 'widget';");
};

exports.down = (knex: any) => knex.raw('');

exports.config = {
    transaction: false,
};
