import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TYPE LICENSE_LIMIT_TYPE AS ENUM ('regular', 'forced');

        CREATE TABLE license_limits (
            license_limit_id BIGINT NOT NULL PRIMARY KEY DEFAULT get_id(),
            meta JSONB NOT NULL DEFAULT '{}'::jsonb,
            tenant_id TEXT NOT NULL DEFAULT 'common' REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE,
            type LICENSE_LIMIT_TYPE NOT NULL,
            started_at TIMESTAMPTZ NOT NULL,
            creators_limit_value INT NOT NULL,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX license_limits_tenant_id_started_at_desc_idx ON license_limits(tenant_id, started_at DESC);
        CREATE INDEX license_limits_started_at_idx ON license_limits(started_at);
        CREATE INDEX license_limits_creators_limit_value_idx ON license_limits(creators_limit_value);

        CREATE TYPE LICENSE_TYPE AS ENUM ('creator', 'viewer');

        CREATE TABLE licenses (
            license_id BIGINT NOT NULL PRIMARY KEY DEFAULT get_id(),
            meta JSONB NOT NULL DEFAULT '{}'::jsonb,
            tenant_id TEXT NOT NULL DEFAULT 'common' REFERENCES tenants (tenant_id) ON UPDATE CASCADE ON DELETE CASCADE,
            user_id TEXT NOT NULL,
            license_type LICENSE_TYPE NOT NULL,
            expires_at TIMESTAMPTZ,
            created_by TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by TEXT NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE UNIQUE INDEX licenses_tenant_id_user_id_license_type_unique_idx ON licenses(tenant_id, user_id, license_type);
        CREATE INDEX licenses_tenant_id_license_type_expires_at_idx ON licenses(tenant_id, license_type, expires_at);
        CREATE INDEX licenses_tenant_id_expires_at_idx ON licenses(tenant_id, expires_at);
        CREATE INDEX licenses_tenant_id_created_at_idx ON licenses(tenant_id, created_at);
        CREATE INDEX licenses_tenant_id_updated_at_idx ON licenses(tenant_id, updated_at);

        CREATE FUNCTION get_current_and_next_limits(
            p_tenant_id TEXT
        ) RETURNS TABLE(
            creators_limit_value INT,
            started_at TIMESTAMPTZ
        ) AS $$
            SELECT * FROM (
                SELECT 
                    creators_limit_value,
                    started_at
                FROM license_limits
                WHERE tenant_id = p_tenant_id
                AND started_at <= NOW()
                ORDER BY started_at DESC
                LIMIT 1
            ) AS current_limit
            
            UNION ALL
            
            SELECT * FROM (
                SELECT 
                    creators_limit_value,
                    started_at
                FROM license_limits
                WHERE tenant_id = p_tenant_id
                AND started_at > NOW()
                ORDER BY started_at ASC
            ) AS next_limits;
        $$ LANGUAGE SQL STABLE;

        CREATE FUNCTION count_active_creator_licenses(
            p_tenant_id TEXT,
            p_at_time TIMESTAMPTZ
        ) RETURNS BIGINT AS $$
            SELECT COUNT(*) FROM licenses
            WHERE
                tenant_id = p_tenant_id AND 
                license_type = 'creator' AND
                (expires_at IS NULL OR expires_at > p_at_time);
        $$ LANGUAGE SQL STABLE;

        CREATE FUNCTION check_limit_consistency(
            p_tenant_id TEXT,
            p_limit_value INT,
            p_check_time TIMESTAMPTZ
        ) RETURNS VOID AS $$
        DECLARE
            v_active_creator_licenses_count BIGINT;
        BEGIN
            v_active_creator_licenses_count := count_active_creator_licenses(p_tenant_id, p_check_time);

            IF
                (p_limit_value IS NULL AND v_active_creator_licenses_count > 0) OR 
                (p_limit_value IS NOT NULL AND v_active_creator_licenses_count > p_limit_value)
            THEN
                RAISE EXCEPTION 'LICENSES_CONSISTENCY_VIOLATION'
                USING 
                    DETAIL = json_build_object(
                        'tenant_id', p_tenant_id,
                        'check_time', p_check_time,
                        'creators_limit_value', p_limit_value,
                        'active_creator_licenses_count', v_active_creator_licenses_count,
                        'error_code', 'LICENSES_CONSISTENCY_VIOLATION'
                    )::text,
                    ERRCODE = 'P0001';
            END IF;
        END;
        $$ LANGUAGE plpgsql;

        CREATE OR REPLACE FUNCTION enforce_license_limits_statement()
        RETURNS TRIGGER AS $$
        DECLARE
            v_tenant_id TEXT;
            v_limit RECORD;
            v_now TIMESTAMPTZ;
        BEGIN
            v_now := NOW();

            IF TG_OP = 'INSERT' THEN
                FOR v_tenant_id IN
                    SELECT DISTINCT tenant_id FROM new_table WHERE tenant_id != 'common'
                LOOP
                    FOR v_limit IN
                        SELECT * FROM get_current_and_next_limits(v_tenant_id)
                    LOOP
                        PERFORM check_limit_consistency(
                            v_tenant_id, 
                            v_limit.creators_limit_value, 
                            v_limit.started_at
                        );
                    END LOOP;
                END LOOP;
            
            ELSIF TG_OP = 'UPDATE' THEN
                FOR v_tenant_id IN
                    SELECT DISTINCT tenant_id FROM (
                        SELECT tenant_id FROM new_table
                        UNION
                        SELECT tenant_id FROM old_table
                    ) AS combined WHERE tenant_id != 'common'
                LOOP
                    FOR v_limit IN
                        SELECT * FROM get_current_and_next_limits(v_tenant_id)
                    LOOP
                        PERFORM check_limit_consistency(
                            v_tenant_id, 
                            v_limit.creators_limit_value, 
                            v_limit.started_at
                        );
                    END LOOP;
                END LOOP;

            ELSIF TG_OP = 'DELETE' THEN
                FOR v_tenant_id IN
                    SELECT DISTINCT tenant_id FROM old_table WHERE tenant_id != 'common'
                LOOP
                    FOR v_limit IN
                        SELECT * FROM get_current_and_next_limits(v_tenant_id)
                    LOOP
                        PERFORM check_limit_consistency(
                            v_tenant_id, 
                            v_limit.creators_limit_value, 
                            v_limit.started_at
                        );
                    END LOOP;

                    IF NOT FOUND AND TG_TABLE_NAME = 'license_limits' THEN
                        PERFORM check_limit_consistency(v_tenant_id, NULL, v_now);
                    END IF;
                END LOOP;
            END IF;

            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER enforce_license_limits_on_licenses_insert
            AFTER INSERT ON licenses
            REFERENCING NEW TABLE AS new_table
            FOR EACH STATEMENT
            EXECUTE FUNCTION enforce_license_limits_statement();

        CREATE TRIGGER enforce_license_limits_on_licenses_update
            AFTER UPDATE ON licenses
            REFERENCING NEW TABLE AS new_table OLD TABLE AS old_table
            FOR EACH STATEMENT
            EXECUTE FUNCTION enforce_license_limits_statement();

        CREATE TRIGGER enforce_license_limits_on_licenses_delete
            AFTER DELETE ON licenses
            REFERENCING OLD TABLE AS old_table
            FOR EACH STATEMENT
            EXECUTE FUNCTION enforce_license_limits_statement();

        CREATE TRIGGER enforce_license_limits_on_license_limits_insert
            AFTER INSERT ON license_limits
            REFERENCING NEW TABLE AS new_table
            FOR EACH STATEMENT
            EXECUTE FUNCTION enforce_license_limits_statement();

        CREATE TRIGGER enforce_license_limits_on_license_limits_update
            AFTER UPDATE ON license_limits
            REFERENCING NEW TABLE AS new_table OLD TABLE AS old_table
            FOR EACH STATEMENT
            EXECUTE FUNCTION enforce_license_limits_statement();

        CREATE TRIGGER enforce_license_limits_on_license_limits_delete
            AFTER DELETE ON license_limits
            REFERENCING OLD TABLE AS old_table
            FOR EACH STATEMENT
            EXECUTE FUNCTION enforce_license_limits_statement();
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP TRIGGER enforce_license_limits_on_license_limits_delete ON license_limits;
        DROP TRIGGER enforce_license_limits_on_license_limits_update ON license_limits;
        DROP TRIGGER enforce_license_limits_on_license_limits_insert ON license_limits;
        DROP TRIGGER enforce_license_limits_on_licenses_delete ON licenses;
        DROP TRIGGER enforce_license_limits_on_licenses_update ON licenses;
        DROP TRIGGER enforce_license_limits_on_licenses_insert ON licenses;

        DROP FUNCTION enforce_license_limits_statement();
        DROP FUNCTION check_limit_consistency(TEXT, INT, TIMESTAMPTZ);
        DROP FUNCTION count_active_creator_licenses(TEXT, TIMESTAMPTZ);
        DROP FUNCTION get_current_and_next_limits(TEXT);

        DROP INDEX licenses_tenant_id_updated_at_idx;
        DROP INDEX licenses_tenant_id_created_at_idx;
        DROP INDEX licenses_tenant_id_expires_at_idx;
        DROP INDEX licenses_tenant_id_license_type_expires_at_idx;
        DROP INDEX licenses_tenant_id_user_id_license_type_unique_idx;
        DROP TABLE licenses;
        DROP TYPE LICENSE_TYPE;

        DROP INDEX license_limits_creators_limit_value_idx;
        DROP INDEX license_limits_started_at_idx;
        DROP INDEX license_limits_tenant_id_started_at_desc_idx;
        DROP TABLE license_limits;
        DROP TYPE LICENSE_LIMIT_TYPE;
    `);
}
