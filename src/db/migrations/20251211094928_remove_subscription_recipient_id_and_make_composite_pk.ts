import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE subscription_recipients DROP CONSTRAINT subscription_recipients_pkey;
        ALTER TABLE subscription_recipients DROP COLUMN subscription_recipient_id;
        DROP INDEX IF EXISTS subscription_recipients_subscription_id_user_id_transport_unique_idx;

        ALTER TABLE subscription_recipients ADD PRIMARY KEY (subscription_id, user_id, transport);
    `);
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw(`
        ALTER TABLE subscription_recipients DROP CONSTRAINT subscription_recipients_pkey;

        ALTER TABLE subscription_recipients ADD COLUMN subscription_recipient_id BIGINT NOT NULL DEFAULT get_id();
        ALTER TABLE subscription_recipients ADD PRIMARY KEY (subscription_recipient_id);
        CREATE UNIQUE INDEX subscription_recipients_subscription_id_user_id_transport_unique_idx ON subscription_recipients(subscription_id, user_id, transport);
    `);
}
