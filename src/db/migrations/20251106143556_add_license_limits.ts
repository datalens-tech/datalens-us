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
        CREATE INDEX licenses_tenant_id_license_type_created_at_expires_at_idx ON licenses(tenant_id, license_type, created_at, expires_at);
        CREATE INDEX licenses_tenant_id_expires_at_idx ON licenses(tenant_id, expires_at);
        CREATE INDEX licenses_tenant_id_created_at_idx ON licenses(tenant_id, created_at);
        CREATE INDEX licenses_tenant_id_updated_at_idx ON licenses(tenant_id, updated_at);

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

        CREATE FUNCTION find_license_violations(
            p_tenant_id TEXT,
            p_check_times TIMESTAMPTZ[],
            p_check_null_limit BOOLEAN DEFAULT FALSE
        ) RETURNS TABLE(
            tenant_id TEXT,
            check_time TIMESTAMPTZ,
            creators_limit_value INT,
            active_licenses_count BIGINT
        ) AS $$
        BEGIN
            RETURN QUERY
            WITH check_times AS (
                SELECT DISTINCT t.check_time
                FROM unnest(p_check_times) AS t(check_time)
                WHERE t.check_time >= NOW()
                AND t.check_time IS NOT NULL
            ),
            violations AS (
                SELECT
                    p_tenant_id as tenant_id,
                    ct.check_time,
                    get_tenant_creators_limit_value(p_tenant_id, ct.check_time) AS creators_limit_value,
                    COUNT(l.license_id) as active_licenses_count
                FROM check_times AS ct
                LEFT JOIN licenses AS l ON
                    l.tenant_id = p_tenant_id
                    AND l.license_type = 'creator'
                    AND l.created_at <= ct.check_time
                    AND (l.expires_at IS NULL OR l.expires_at > ct.check_time)
                GROUP BY ct.check_time
            )
            SELECT
                v.tenant_id,
                v.check_time,
                v.creators_limit_value,
                v.active_licenses_count
            FROM violations v
            WHERE
                (p_check_null_limit AND v.creators_limit_value IS NULL AND v.active_licenses_count > 0) OR
                (v.creators_limit_value IS NOT NULL AND v.active_licenses_count > v.creators_limit_value);
        END;
        $$ LANGUAGE plpgsql STABLE;

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
                    v_check_times := v_check_times || NEW.created_at || NEW.expires_at;

                ELSIF TG_OP = 'UPDATE' THEN
                    v_check_times := v_check_times || OLD.created_at || NEW.created_at;

                    IF OLD.expires_at IS DISTINCT FROM NEW.expires_at THEN
                        v_check_times := v_check_times || OLD.expires_at || NEW.expires_at;
                    END IF;
                END IF;

            ELSIF TG_TABLE_NAME = 'license_limits' THEN
                IF TG_OP = 'INSERT' THEN
                    v_check_times := v_check_times || NEW.started_at;

                ELSIF TG_OP = 'UPDATE' THEN
                    v_check_times := v_check_times || OLD.started_at || NEW.started_at;

                ELSIF TG_OP = 'DELETE' THEN
                    v_check_times := v_check_times || OLD.started_at;
                END IF;
            END IF;

            FOR v_violation IN
                SELECT *
                FROM find_license_violations(v_tenant_id, v_check_times, TG_TABLE_NAME = 'license_limits')
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
        DROP FUNCTION find_license_violations(TEXT, TIMESTAMPTZ[], BOOLEAN);
        DROP FUNCTION get_tenant_creators_limit_value(TEXT, TIMESTAMPTZ);

        DROP INDEX licenses_tenant_id_updated_at_idx;
        DROP INDEX licenses_tenant_id_created_at_idx;
        DROP INDEX licenses_tenant_id_expires_at_idx;
        DROP INDEX licenses_tenant_id_license_type_created_at_expires_at_idx;
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
