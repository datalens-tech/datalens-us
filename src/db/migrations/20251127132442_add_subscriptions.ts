import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TYPE subscription_status_enum AS ENUM ('active', 'stopped', 'suspended');
        CREATE TYPE subscription_content_type_enum AS ENUM ('dash', 'chart', 'report');
        CREATE TYPE subscription_trigger_type_enum AS ENUM ('cron', 'dataset_refresh', 'threshold', 'relative', 'non_empty', 'is_true');
        CREATE TYPE subscription_artifact_type_enum AS ENUM ('png');

        CREATE TABLE subscriptions (
            subscription_id BIGINT NOT NULL PRIMARY KEY DEFAULT get_id(),
            title TEXT NOT NULL,
            description TEXT,
            meta JSONB NOT NULL DEFAULT '{}'::jsonb,
            
            status subscription_status_enum NOT NULL DEFAULT 'active',
            tenant_id TEXT NOT NULL DEFAULT 'common' REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE,
            workbook_id BIGINT NOT NULL REFERENCES workbooks (workbook_id) ON UPDATE CASCADE ON DELETE CASCADE,
            
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

            suspended_at TIMESTAMPTZ,
            
            content_type subscription_content_type_enum NOT NULL,
            content_entry_id BIGINT NOT NULL REFERENCES entries (entry_id) ON UPDATE CASCADE ON DELETE CASCADE,
            content_options JSONB NOT NULL DEFAULT '{}'::jsonb,

            trigger_type subscription_trigger_type_enum NOT NULL,
            trigger_entry_id BIGINT DEFAULT NULL REFERENCES entries (entry_id) ON UPDATE CASCADE ON DELETE SET NULL,
            trigger_options JSONB NOT NULL DEFAULT '{}'::jsonb,
            
            artifact_type subscription_artifact_type_enum NOT NULL,
            artifact_options JSONB NOT NULL DEFAULT '{}'::jsonb
        );

        CREATE INDEX subscriptions_tenant_id_content_entry_id_created_at_desc_idx ON subscriptions(tenant_id, content_entry_id, created_at DESC);
        CREATE INDEX subscriptions_tenant_id_created_by_idx ON subscriptions(tenant_id, created_by);

        CREATE TYPE subscription_recipient_transport_type_enum AS ENUM ('email', 'tg');

        CREATE TABLE subscription_recipients (
            subscription_recipient_id BIGINT NOT NULL PRIMARY KEY DEFAULT get_id(),
            subscription_id BIGINT NOT NULL REFERENCES subscriptions (subscription_id) ON UPDATE CASCADE ON DELETE CASCADE,

            user_id TEXT NOT NULL,
            transport subscription_recipient_transport_type_enum NOT NULL,

            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        );

        CREATE UNIQUE INDEX subscription_recipients_subscription_id_user_id_transport_unique_idx ON subscription_recipients(subscription_id, user_id, transport);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX subscription_recipients_subscription_id_user_id_transport_unique_idx;
        DROP TABLE subscription_recipients;
        DROP TYPE subscription_recipient_transport_type_enum;

        DROP INDEX subscriptions_tenant_id_content_entry_id_created_at_desc_idx;
        DROP INDEX subscriptions_tenant_id_created_by_idx;
        DROP TABLE subscriptions;
        DROP TYPE subscription_status_enum;
        DROP TYPE subscription_content_type_enum;
        DROP TYPE subscription_trigger_type_enum;
        DROP TYPE subscription_artifact_type_enum;
    `);
}
