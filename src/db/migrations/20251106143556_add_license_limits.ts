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

        CREATE INDEX license_limits_tenant_id_idx ON license_limits(tenant_id);
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

        CREATE UNIQUE INDEX licenses_tenant_id_license_type_user_id_unique_idx ON licenses(tenant_id, license_type, user_id);
        CREATE INDEX licenses_expires_at_idx ON licenses(expires_at);
        CREATE INDEX licenses_created_at_idx ON licenses(created_at);
        CREATE INDEX licenses_updated_at_idx ON licenses(updated_at);

        CREATE FUNCTION get_tenant_creators_limit_value(
            p_tenant_id TEXT,
            p_at_time TIMESTAMPTZ DEFAULT NOW()
        ) RETURNS INT AS $$
            SELECT creators_limit_value
            FROM license_limits
            WHERE tenant_id = p_tenant_id
            AND started_at <= p_at_time
            ORDER BY started_at DESC
            LIMIT 1;
        $$ LANGUAGE SQL STABLE;

        CREATE FUNCTION enforce_license_limits()
        RETURNS TRIGGER AS $$
        DECLARE
            v_violation RECORD;
            v_tenant_id TEXT;
            v_check_times TIMESTAMPTZ[];
        BEGIN
            IF TG_OP = 'DELETE' THEN
                v_tenant_id := OLD.tenant_id;
            ELSE
                v_tenant_id := NEW.tenant_id;
            END IF;

            IF v_tenant_id = 'common' THEN
                IF TG_OP = 'DELETE' THEN
                    RETURN OLD;
                ELSE
                    RETURN NEW;
                END IF;
            END IF;

            v_check_times := ARRAY[NOW()];

            IF TG_TABLE_NAME = 'licenses' THEN
                IF TG_OP = 'INSERT' THEN
                    v_check_times := v_check_times || NEW.created_at;
                    IF NEW.expires_at IS NOT NULL THEN
                        v_check_times := v_check_times || NEW.expires_at;
                    END IF;

                ELSIF TG_OP = 'UPDATE' THEN
                    IF OLD.created_at != NEW.created_at THEN
                        v_check_times := v_check_times || OLD.created_at || NEW.created_at;
                    ELSE
                        v_check_times := v_check_times || NEW.created_at;
                    END IF;

                    IF OLD.expires_at IS DISTINCT FROM NEW.expires_at THEN
                        IF OLD.expires_at IS NOT NULL THEN
                            v_check_times := v_check_times || OLD.expires_at;
                        END IF;
                        IF NEW.expires_at IS NOT NULL THEN
                            v_check_times := v_check_times || NEW.expires_at;
                        END IF;
                    END IF;

                ELSIF TG_OP = 'DELETE' THEN
                    v_check_times := v_check_times || OLD.created_at;
                    IF OLD.expires_at IS NOT NULL THEN
                        v_check_times := v_check_times || OLD.expires_at;
                    END IF;
                END IF;

            ELSIF TG_TABLE_NAME = 'license_limits' THEN
                IF TG_OP = 'INSERT' THEN
                    v_check_times := v_check_times || NEW.started_at;

                ELSIF TG_OP = 'UPDATE' THEN
                    IF OLD.started_at != NEW.started_at THEN
                        v_check_times := v_check_times || OLD.started_at || NEW.started_at;
                    ELSE
                        v_check_times := v_check_times || NEW.started_at;
                    END IF;

                ELSIF TG_OP = 'DELETE' THEN
                    v_check_times := v_check_times || OLD.started_at;
                END IF;
            END IF;

            FOR v_violation IN
                WITH check_times AS (
                    SELECT check_time
                    FROM (SELECT DISTINCT unnest(v_check_times) AS check_time) AS dct
                    WHERE check_time >= NOW()
                ),
                violations AS (
                    SELECT 
                        v_tenant_id as tenant_id,
                        ct.check_time,
                        get_tenant_creators_limit_value(v_tenant_id, ct.check_time) AS creators_limit_value,
                        COUNT(l.license_id) as active_licenses_count
                    FROM check_times AS ct
                    LEFT JOIN licenses AS l ON 
                        l.tenant_id = v_tenant_id
                        AND l.license_type = 'creator'
                        AND l.created_at <= ct.check_time
                        AND (l.expires_at IS NULL OR l.expires_at > ct.check_time)
                    WHERE ct.check_time IS NOT NULL
                    GROUP BY ct.check_time
                )
                SELECT * FROM violations
                WHERE
                    (creators_limit_value IS NULL AND active_licenses_count > 0 AND TG_TABLE_NAME = 'license_limits') OR
                    (creators_limit_value IS NOT NULL AND active_licenses_count > creators_limit_value)
                LIMIT 1
            LOOP
                RAISE EXCEPTION 'LICENSES_CONSISTENCY_VIOLATION'
                USING 
                    DETAIL = json_build_object(
                        'tenant_id', v_tenant_id,
                        'check_time', v_violation.check_time,
                        'creators_limit_value', v_violation.creators_limit_value,
                        'active_licenses_count', v_violation.active_licenses_count,
                        'error_code', 'LICENSES_CONSISTENCY_VIOLATION'
                    )::text,
                    ERRCODE = 'P0001';
            END LOOP;

            IF TG_OP = 'DELETE' THEN
                RETURN OLD;
            ELSE
                RETURN NEW;
            END IF;
        END;
        $$ LANGUAGE plpgsql;

        CREATE CONSTRAINT TRIGGER enforce_license_limits_on_licenses
            AFTER INSERT OR UPDATE OR DELETE ON licenses
            DEFERRABLE INITIALLY DEFERRED
            FOR EACH ROW
            EXECUTE PROCEDURE enforce_license_limits();

        CREATE CONSTRAINT TRIGGER enforce_license_limits_on_license_limits
            AFTER INSERT OR UPDATE OR DELETE ON license_limits
            DEFERRABLE INITIALLY DEFERRED
            FOR EACH ROW
            EXECUTE PROCEDURE enforce_license_limits();
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP TRIGGER enforce_license_limits_on_license_limits ON license_limits;
        DROP TRIGGER enforce_license_limits_on_licenses ON licenses;

        DROP FUNCTION enforce_license_limits();
        DROP FUNCTION get_tenant_creators_limit_value(TEXT, TIMESTAMPTZ);

        DROP INDEX licenses_updated_at_idx;
        DROP INDEX licenses_created_at_idx;
        DROP INDEX licenses_expires_at_idx;
        DROP INDEX licenses_tenant_id_license_type_user_id_unique_idx;
        DROP TABLE licenses;
        DROP TYPE LICENSE_TYPE;

        DROP INDEX license_limits_creators_limit_value_idx;
        DROP INDEX license_limits_started_at_idx;
        DROP INDEX license_limits_tenant_id_idx;
        DROP TABLE license_limits;
        DROP TYPE LICENSE_LIMIT_TYPE;
    `);
}
