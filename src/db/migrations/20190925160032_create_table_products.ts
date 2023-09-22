import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<any> {
    return knex.raw(`
        CREATE TABLE products (
            product_id BIGINT NOT NULL DEFAULT get_id() PRIMARY KEY,
            category TEXT,
            purchase_type TEXT,
            deploy_type TEXT,
            template_name TEXT,
            connector_name TEXT,
            price DECIMAL,
            enabled BOOLEAN DEFAULT false,

            title_ru TEXT,
            description_ru TEXT,
            summary_ru TEXT,
            vendor_ru TEXT,

            title_en TEXT,
            description_en TEXT,
            summary_en TEXT,
            vendor_en TEXT
        );
    `);
};

exports.down = function (knex: Knex): Promise<any> {
    return knex.raw(`
        DROP TABLE IF EXISTS products;
    `);
};
