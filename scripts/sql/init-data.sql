

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE "us-db-ci_purgeable" (FORCE);

CREATE DATABASE "us-db-ci_purgeable" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'en_US.utf8';


ALTER DATABASE "us-db-ci_purgeable" OWNER TO us;

\connect -reuse-previous=on "dbname='us-db-ci_purgeable'"

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS btree_gin WITH SCHEMA public;



COMMENT ON EXTENSION btree_gin IS 'support for indexing common datatypes in GIN';



CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;



COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';



CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;



COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';



CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;



COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';



CREATE TYPE public.comment_type AS ENUM (
    'flag-x',
    'line-x',
    'band-x',
    'dot-x-y'
);


ALTER TYPE public.comment_type OWNER TO us;


CREATE TYPE public.operation_status_enum AS ENUM (
    'scheduled',
    'failed',
    'done'
);


ALTER TYPE public.operation_status_enum OWNER TO us;


CREATE TYPE public.scope AS ENUM (
    'dataset',
    'pdf',
    'folder',
    'dash',
    'connection',
    'widget',
    'config'
);


ALTER TYPE public.scope OWNER TO us;


CREATE FUNCTION public.base36_encode(digits bigint, coding_base character[]) RETURNS character varying
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    DECLARE
        ret varchar;
        val bigint;
    BEGIN
        val := digits;
        ret := '';
        IF val < 0 THEN
            val := val * - 1;
        END IF;
        WHILE val != 0 LOOP
            ret := coding_base [(val % 36)+1] || ret;
            val := val / 36;
        END LOOP;
        RETURN ret;
    END;
    $$;


ALTER FUNCTION public.base36_encode(digits bigint, coding_base character[]) OWNER TO us;


CREATE FUNCTION public.encode_id(id bigint) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    DECLARE
        coding_base_str text;
        coding_base_sub1 text;
        coding_base_sub2 text;
        rotation_number int;
        coding_base_initial char[];
        coding_base_rotated char[];
        encoded_id text;
        last_symbol varchar;
    BEGIN
        rotation_number := MOD(MOD(id, 100), 36);
        coding_base_str := '0123456789abcdefghijklmnopqrstuvwxyz';
        coding_base_sub1 := substring(coding_base_str, rotation_number + 1);
        coding_base_sub2 := substring(coding_base_str, 0, rotation_number + 1);
        coding_base_initial := regexp_split_to_array(coding_base_str, '');
        coding_base_rotated := regexp_split_to_array(concat(coding_base_sub1, coding_base_sub2), '');
        last_symbol := base36_encode(rotation_number, coding_base_initial);

        IF last_symbol = ''
        THEN
            encoded_id := CONCAT(base36_encode(id, coding_base_rotated), '0');
        ELSE
            encoded_id := CONCAT(base36_encode(id, coding_base_rotated), last_symbol);
        END IF;
        return encoded_id;
    END;
    $$;


ALTER FUNCTION public.encode_id(id bigint) OWNER TO us;


CREATE FUNCTION public.get_id(OUT result bigint) RETURNS bigint
    LANGUAGE plpgsql
    AS $$
    DECLARE
        our_epoch bigint := 1514754000000;
        seq_id bigint;
        now_millis bigint;
        shard_id int := 1;
    BEGIN
        SELECT nextval('counter_seq') % 4096 INTO seq_id;

        SELECT FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000) INTO now_millis;
        result := (now_millis - our_epoch) << 23;
        result := result | (shard_id << 10);
        result := result | (seq_id);
    END;
    $$;


ALTER FUNCTION public.get_id(OUT result bigint) OWNER TO us;


CREATE FUNCTION public.naturalsort(text) RETURNS bytea
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
            SELECT string_agg(
                convert_to(
                    coalesce(
                        r[2],
                        length(length(r[1])::text) || length(r[1])::text || r[1]
                    ),
                    'UTF8'
                ),
                '\x00'
            ) from regexp_matches(
                regexp_replace(
                    regexp_replace($1, 'ё', 'е', 'g'),
                    '_', '!', 'g'
                ),
                '0*([0-9]+)|([^0-9]+)', 'g'
            ) r;
        $_$;


ALTER FUNCTION public.naturalsort(text) OWNER TO us;


CREATE FUNCTION public.update_collections() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
            BEGIN
                NEW.sort_title := naturalsort(NEW.title);
                RETURN NEW;
            END
        $$;


ALTER FUNCTION public.update_collections() OWNER TO us;


CREATE FUNCTION public.update_entries() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
        DECLARE
          key TEXT;
        BEGIN
          key := NEW.key;

          NEW.name := SUBSTRING(key FROM '([^/]*)/?$');
          NEW.sort_name := naturalsort(NEW.name);

          RETURN NEW;
        END
        $_$;


ALTER FUNCTION public.update_entries() OWNER TO us;


CREATE FUNCTION public.update_workbooks() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
            BEGIN
                NEW.sort_title := naturalsort(NEW.title);
                RETURN NEW;
            END
        $$;


ALTER FUNCTION public.update_workbooks() OWNER TO us;

SET default_tablespace = '';

SET default_table_access_method = heap;


CREATE TABLE public.collections (
    collection_id bigint DEFAULT public.get_id() NOT NULL,
    title text NOT NULL,
    description text,
    parent_id bigint,
    tenant_id text DEFAULT 'common'::text NOT NULL,
    project_id text,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_by text,
    deleted_at timestamp with time zone,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    title_lower text NOT NULL,
    sort_title bytea NOT NULL
);


ALTER TABLE public.collections OWNER TO us;


CREATE TABLE public.color_palettes (
    color_palette_id bigint DEFAULT public.get_id() NOT NULL,
    tenant_id text DEFAULT 'common'::text NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    colors jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_gradient boolean DEFAULT false NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    CONSTRAINT color_palettes_non_empty_name_constraint CHECK ((btrim(name) <> ''::text))
);


ALTER TABLE public.color_palettes OWNER TO us;


CREATE TABLE public.comments (
    id uuid DEFAULT public.uuid_generate_v1mc() NOT NULL,
    feed text NOT NULL,
    creator_login text NOT NULL,
    created_date timestamp(0) with time zone DEFAULT now(),
    modifier_login text,
    modified_date timestamp(0) with time zone,
    date timestamp(0) with time zone NOT NULL,
    date_until timestamp(0) with time zone,
    type public.comment_type NOT NULL,
    text text NOT NULL,
    meta jsonb NOT NULL,
    params jsonb,
    is_removed boolean DEFAULT false,
    removed_date timestamp(0) with time zone,
    remover_login text,
    CONSTRAINT date_until_after_date CHECK (((date_until IS NULL) OR (date_until >= date))),
    CONSTRAINT is_removed_with_removed_date_with_remover_login CHECK ((((NOT is_removed) AND (removed_date IS NULL) AND (remover_login IS NULL)) OR (is_removed AND (removed_date IS NOT NULL) AND (remover_login IS NOT NULL)))),
    CONSTRAINT modified_date_after_created_date CHECK (((modified_date IS NULL) OR (modified_date > created_date))),
    CONSTRAINT modifier_login_with_modified_date CHECK ((((modifier_login IS NULL) AND (modified_date IS NULL)) OR ((modifier_login IS NOT NULL) AND (modified_date IS NOT NULL))))
);


ALTER TABLE public.comments OWNER TO us;


CREATE SEQUENCE public.counter_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.counter_seq OWNER TO us;


CREATE TABLE public.embedding_secrets (
    embedding_secret_id bigint DEFAULT public.get_id() NOT NULL,
    title text NOT NULL,
    workbook_id bigint NOT NULL,
    public_key text NOT NULL,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.embedding_secrets OWNER TO us;


CREATE TABLE public.embeds (
    embed_id bigint DEFAULT public.get_id() NOT NULL,
    title text NOT NULL,
    embedding_secret_id bigint NOT NULL,
    entry_id bigint NOT NULL,
    deps_ids text[] DEFAULT '{}'::text[] NOT NULL,
    unsigned_params text[] DEFAULT '{}'::text[] NOT NULL,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.embeds OWNER TO us;


CREATE TABLE public.entries (
    scope public.scope,
    type text NOT NULL,
    key text,
    inner_meta jsonb,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_by text NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    is_deleted boolean DEFAULT false,
    deleted_at timestamp with time zone,
    hidden boolean DEFAULT false,
    display_key text,
    entry_id bigint DEFAULT public.get_id() NOT NULL,
    saved_id bigint,
    published_id bigint,
    tenant_id text,
    name text,
    sort_name bytea,
    public boolean DEFAULT false,
    unversioned_data jsonb DEFAULT '{}'::jsonb,
    workbook_id bigint
);


ALTER TABLE public.entries OWNER TO us;


CREATE TABLE public.favorites (
    entry_id bigint NOT NULL,
    tenant_id text NOT NULL,
    login text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.favorites OWNER TO us;


CREATE TABLE public.links (
    from_id bigint NOT NULL,
    to_id bigint NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.links OWNER TO us;


CREATE TABLE public.locks (
    lock_id bigint DEFAULT public.get_id() NOT NULL,
    entry_id bigint NOT NULL,
    lock_token text NOT NULL,
    expiry_date timestamp with time zone NOT NULL,
    login text,
    start_date timestamp with time zone DEFAULT now()
);


ALTER TABLE public.locks OWNER TO us;


CREATE TABLE public.migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


ALTER TABLE public.migrations OWNER TO us;


CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO us;


ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;



CREATE TABLE public.migrations_lock (
    index integer NOT NULL,
    is_locked integer
);


ALTER TABLE public.migrations_lock OWNER TO us;


CREATE SEQUENCE public.migrations_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_lock_index_seq OWNER TO us;


ALTER SEQUENCE public.migrations_lock_index_seq OWNED BY public.migrations_lock.index;



CREATE TABLE public.migrations_tenants (
    from_id text NOT NULL,
    to_id text NOT NULL,
    migrating boolean DEFAULT true NOT NULL,
    migration_meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.migrations_tenants OWNER TO us;


CREATE TABLE public.operations (
    operation_id bigint DEFAULT public.get_id() NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    result jsonb DEFAULT '{}'::jsonb NOT NULL,
    status public.operation_status_enum DEFAULT 'scheduled'::public.operation_status_enum NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    inner_meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    run_after timestamp with time zone DEFAULT now() NOT NULL,
    retries_left smallint DEFAULT 3 NOT NULL,
    retries_interval_sec integer DEFAULT 180 NOT NULL,
    tenant_id text
);


ALTER TABLE public.operations OWNER TO us;


CREATE TABLE public.presets (
    preset_id bigint DEFAULT public.get_id() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.presets OWNER TO us;


CREATE TABLE public.revisions (
    data jsonb,
    meta jsonb,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_by text NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    rev_id bigint DEFAULT public.get_id() NOT NULL,
    entry_id bigint,
    links jsonb
);


ALTER TABLE public.revisions OWNER TO us;


CREATE TABLE public.states (
    hash text NOT NULL,
    entry_id bigint NOT NULL,
    data jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.states OWNER TO us;


CREATE TABLE public.templates (
    name text NOT NULL,
    data jsonb
);


ALTER TABLE public.templates OWNER TO us;


CREATE TABLE public.tenants (
    tenant_id text NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    enabled boolean DEFAULT false NOT NULL,
    deleting boolean DEFAULT false NOT NULL,
    last_init_at timestamp with time zone DEFAULT now() NOT NULL,
    retries_count integer DEFAULT 0 NOT NULL,
    collections_enabled boolean DEFAULT false NOT NULL,
    folders_enabled boolean DEFAULT true NOT NULL
);


ALTER TABLE public.tenants OWNER TO us;


CREATE TABLE public.user_settings (
    user_id text NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_settings OWNER TO us;


CREATE TABLE public.workbooks (
    workbook_id bigint DEFAULT public.get_id() NOT NULL,
    title text NOT NULL,
    description text,
    project_id text,
    tenant_id text DEFAULT 'common'::text NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    is_template boolean DEFAULT false,
    collection_id bigint,
    deleted_by text,
    updated_by text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    title_lower text NOT NULL,
    sort_title bytea NOT NULL
);


ALTER TABLE public.workbooks OWNER TO us;


ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);



ALTER TABLE ONLY public.migrations_lock ALTER COLUMN index SET DEFAULT nextval('public.migrations_lock_index_seq'::regclass);


















INSERT INTO public.entries VALUES ('dataset', '', '1492153125602067460/dataset', NULL, 'uid:systemId', '2023-08-21 15:41:54.001492+00', 'uid:systemId', '2023-08-21 15:41:54.001492+00', false, NULL, false, '1492153125602067460/Dataset', 1492153125602067460, 1492153125627233285, NULL, 'common', 'dataset', '\x64617461736574', false, '{}', 1492152097326498817);
INSERT INTO public.entries VALUES ('widget', 'table_wizard_node', '1492153949346595846/countries chart', NULL, 'uid:systemId', '2023-08-21 15:43:32.199456+00', 'uid:systemId', '2023-08-21 15:43:32.244649+00', false, NULL, false, '1492153949346595846/Countries chart', 1492153949346595846, 1492153949346595847, 1492153949346595847, 'common', 'countries chart', '\x636f756e7472696573206368617274', false, '{}', 1492152097326498817);
INSERT INTO public.entries VALUES ('dash', '', '1492154032972629001/dashboard', NULL, 'uid:systemId', '2023-08-21 15:43:42.169089+00', 'uid:systemId', '2023-08-21 15:43:42.189241+00', false, NULL, false, '1492154032972629001/Dashboard', 1492154032972629001, 1492155079443088397, 1492155079443088397, 'common', 'dashboard', '\x64617368626f617264', false, '{}', 1492152097326498817);
INSERT INTO public.entries VALUES ('connection', 'postgres', '1492152554757293058/postgres-connection', NULL, 'uid:systemId', '2023-08-21 15:40:45.948583+00', 'uid:systemId', '2023-08-21 15:40:45.948583+00', false, NULL, false, '1492152554757293058/postgres-connection', 1492152554757293058, 1494186007585621007, NULL, 'common', 'postgres-connection', '\x706f7374677265732d636f6e6e656374696f6e', false, '{"password": {"key_id": "key_1", "key_kind": "local_fernet", "cypher_text": "gAAAAABk5zhk8L2mvb1YIpC7IGxMVP7wkFvlGnlC2xf9J6noERCv2EQUvuyJ4S19rMMZCodNQSsmAYxSkU90gZr4fhj-LENCMg=="}}', 1492152097326498817);






INSERT INTO public.links VALUES (1492153125602067460, 1492152554757293058, '21c5d1b1-4039-11ee-80e9-6bd23c6218d3');
INSERT INTO public.links VALUES (1492153125602067460, 1492152554757293058, '228fff82-4039-11ee-80e9-6bd23c6218d3');
INSERT INTO public.links VALUES (1492153125602067460, 1492152554757293058, '29422ba2-4039-11ee-80e9-6bd23c6218d3');
INSERT INTO public.links VALUES (1492153125602067460, 1492152554757293058, '34197060-4039-11ee-80e9-6bd23c6218d3');
INSERT INTO public.links VALUES (1492153949346595846, 1492153125602067460, 'dataset');
INSERT INTO public.links VALUES (1492154032972629001, 1492153125602067460, 'z0s0smbj41ago');
INSERT INTO public.links VALUES (1492154032972629001, 1492153949346595846, 'lmemprddypv8a');






INSERT INTO public.migrations VALUES (1, '20180601125336_create_conf_storage.js', 1, '2023-08-21 15:38:22.343+00');
INSERT INTO public.migrations VALUES (2, '20180605165939_create_comments.js', 1, '2023-08-21 15:38:22.355+00');
INSERT INTO public.migrations VALUES (3, '20180702154500_change_enum.js', 1, '2023-08-21 15:38:22.359+00');
INSERT INTO public.migrations VALUES (4, '20180716130220_add_hidden_column.js', 1, '2023-08-21 15:38:22.361+00');
INSERT INTO public.migrations VALUES (5, '20180726180908_add_display_key_column.js', 1, '2023-08-21 15:38:22.365+00');
INSERT INTO public.migrations VALUES (6, '20180806161134_create_states.js', 1, '2023-08-21 15:38:22.372+00');
INSERT INTO public.migrations VALUES (7, '20180823113205_change_generation_id.js', 1, '2023-08-21 15:38:22.409+00');
INSERT INTO public.migrations VALUES (8, '20180824135211_new_scope_config.js', 1, '2023-08-21 15:38:22.41+00');
INSERT INTO public.migrations VALUES (9, '20180824164101_change_organization_id.js', 1, '2023-08-21 15:38:22.413+00');
INSERT INTO public.migrations VALUES (10, '20180828110635_locks.js', 1, '2023-08-21 15:38:22.42+00');
INSERT INTO public.migrations VALUES (11, '20180903150447_modify_tables.js', 1, '2023-08-21 15:38:22.431+00');
INSERT INTO public.migrations VALUES (12, '20180914104517_create_favorites.js', 1, '2023-08-21 15:38:22.44+00');
INSERT INTO public.migrations VALUES (13, '20180921134900_change_folderId_on_tenantId.js', 1, '2023-08-21 15:38:22.442+00');
INSERT INTO public.migrations VALUES (14, '20180928164651_create_tenants.js', 1, '2023-08-21 15:38:22.45+00');
INSERT INTO public.migrations VALUES (15, '20190218115628_full_text_search.js', 1, '2023-08-21 15:38:22.455+00');
INSERT INTO public.migrations VALUES (16, '20190221102420_mirrored_tenant.js', 1, '2023-08-21 15:38:22.458+00');
INSERT INTO public.migrations VALUES (17, '20190227004931_add_enabled_to_tenants.js', 1, '2023-08-21 15:38:22.461+00');
INSERT INTO public.migrations VALUES (18, '20190619130842_links.js', 1, '2023-08-21 15:38:22.47+00');
INSERT INTO public.migrations VALUES (19, '20190702150400_add_name_column.js', 1, '2023-08-21 15:38:22.475+00');
INSERT INTO public.migrations VALUES (20, '20190718112426_naturalsort_name.js', 1, '2023-08-21 15:38:22.48+00');
INSERT INTO public.migrations VALUES (21, '20190806124124_add_new_column_public.js', 1, '2023-08-21 15:38:22.484+00');
INSERT INTO public.migrations VALUES (22, '20190823093629_change_links_pk.js', 1, '2023-08-21 15:38:22.488+00');
INSERT INTO public.migrations VALUES (23, '20190902142957_migrate_timestamp_to_timestampz.js', 1, '2023-08-21 15:38:22.563+00');
INSERT INTO public.migrations VALUES (24, '20190923172424_create_table_templates.js', 1, '2023-08-21 15:38:22.57+00');
INSERT INTO public.migrations VALUES (25, '20190925160032_create_table_products.js', 1, '2023-08-21 15:38:22.577+00');
INSERT INTO public.migrations VALUES (26, '20200211015456_add_foreign_keys.js', 1, '2023-08-21 15:38:22.587+00');
INSERT INTO public.migrations VALUES (27, '20200212005030_add_deleting_to_tenants.js', 1, '2023-08-21 15:38:22.589+00');
INSERT INTO public.migrations VALUES (28, '20200226170029_create_table_user_settings.js', 1, '2023-08-21 15:38:22.596+00');
INSERT INTO public.migrations VALUES (29, '20200324001914_add_mdb_cluster_id_index.js', 1, '2023-08-21 15:38:22.6+00');
INSERT INTO public.migrations VALUES (30, '20200604171500_add_revisions_entry_index.js', 1, '2023-08-21 15:38:22.604+00');
INSERT INTO public.migrations VALUES (31, '20200816224000_add_unversioned_data_to_entries.js', 1, '2023-08-21 15:38:22.607+00');
INSERT INTO public.migrations VALUES (32, '20201018193700_remove_drafts_and_products.js', 1, '2023-08-21 15:38:22.615+00');
INSERT INTO public.migrations VALUES (33, '20210126002000_add_encode_id_procedures.js', 1, '2023-08-21 15:38:22.618+00');
INSERT INTO public.migrations VALUES (34, '20210426130000_fix_encode_id_procedure.js', 1, '2023-08-21 15:38:22.621+00');
INSERT INTO public.migrations VALUES (35, '20210610180000_add_common_tenant.js', 1, '2023-08-21 15:38:22.623+00');
INSERT INTO public.migrations VALUES (36, '20210720181549_add_column_org_id.js', 1, '2023-08-21 15:38:22.625+00');
INSERT INTO public.migrations VALUES (37, '20210729155515_add_org_id_index.js', 1, '2023-08-21 15:38:22.629+00');
INSERT INTO public.migrations VALUES (38, '20210812160428_create_table_workbooks.js', 1, '2023-08-21 15:38:22.64+00');
INSERT INTO public.migrations VALUES (39, '20210819124338_add_entries_workbooks_constraints.js', 1, '2023-08-21 15:38:22.647+00');
INSERT INTO public.migrations VALUES (40, '20210823170614_add_workbook_column_title_uniq.js', 1, '2023-08-21 15:38:22.651+00');
INSERT INTO public.migrations VALUES (41, '20210826143000_remove_search.js', 1, '2023-08-21 15:38:22.654+00');
INSERT INTO public.migrations VALUES (42, '20210914113610_add_deleted_to_workbooks.js', 1, '2023-08-21 15:38:22.656+00');
INSERT INTO public.migrations VALUES (43, '20210929123427_drop_org_id.js', 1, '2023-08-21 15:38:22.659+00');
INSERT INTO public.migrations VALUES (44, '20211203115122_add_presets_table.js', 1, '2023-08-21 15:38:22.665+00');
INSERT INTO public.migrations VALUES (45, '20211223172034_add_is_template_flag_to_workbooks.js', 1, '2023-08-21 15:38:22.668+00');
INSERT INTO public.migrations VALUES (46, '20220221193445_add_init_columns_to_tenants.js', 1, '2023-08-21 15:38:22.672+00');
INSERT INTO public.migrations VALUES (47, '20220629105416_add_migrating_column_to_tenants.js', 1, '2023-08-21 15:38:22.676+00');
INSERT INTO public.migrations VALUES (48, '20220706104748_create_migrations_tenants_table.js', 1, '2023-08-21 15:38:22.683+00');
INSERT INTO public.migrations VALUES (49, '20220802123033_create_collections_table.js', 1, '2023-08-21 15:38:22.7+00');
INSERT INTO public.migrations VALUES (50, '20220803112817_add_collections_uniq_title.js', 1, '2023-08-21 15:38:22.704+00');
INSERT INTO public.migrations VALUES (51, '20220822153431_add_workbooks_updated_by.js', 1, '2023-08-21 15:38:22.707+00');
INSERT INTO public.migrations VALUES (52, '20220824143309_add_collections_enabled_column.js', 1, '2023-08-21 15:38:22.709+00');
INSERT INTO public.migrations VALUES (53, '20220824151940_add_workbooks_uniq_title_index.js', 1, '2023-08-21 15:38:22.714+00');
INSERT INTO public.migrations VALUES (54, '20220824170340_add_operations_table.js', 1, '2023-08-21 15:38:22.726+00');
INSERT INTO public.migrations VALUES (55, '20220824173552_add_title_lower_column_to_collections.js', 1, '2023-08-21 15:38:22.731+00');
INSERT INTO public.migrations VALUES (56, '20220825194806_add_sort_title_column_to_collections_and_workbooks.js', 1, '2023-08-21 15:38:22.738+00');
INSERT INTO public.migrations VALUES (57, '20220831185220_add_folders_enabled_column.js', 1, '2023-08-21 15:38:22.741+00');
INSERT INTO public.migrations VALUES (58, '20221018181859_add_color_palettes.js', 1, '2023-08-21 15:38:22.753+00');
INSERT INTO public.migrations VALUES (59, '20221020185642_change_palette_id_to_color_palette_id.js', 1, '2023-08-21 15:38:22.754+00');
INSERT INTO public.migrations VALUES (60, '20221205182416_color_palette_name_constraint.js', 1, '2023-08-21 15:38:22.758+00');
INSERT INTO public.migrations VALUES (61, '20230206170338_add_uniq_active_lock_per_entry_id_constraint.js', 1, '2023-08-21 15:38:22.762+00');
INSERT INTO public.migrations VALUES (62, '20230315155732_create_embedding_secrets_and_embeds_tables.js', 1, '2023-08-21 15:38:22.779+00');
INSERT INTO public.migrations VALUES (63, '20230405165358_delete_column_mirrored.js', 1, '2023-08-21 15:38:22.782+00');
INSERT INTO public.migrations VALUES (64, '20230605131320_change_uniq_active_lock_per_entry_id_constraint.js', 1, '2023-08-21 15:38:22.786+00');
INSERT INTO public.migrations VALUES (65, '20230605184230_delete_locks_column_is_new.js', 1, '2023-08-21 15:38:22.788+00');



INSERT INTO public.migrations_lock VALUES (1, 0);












INSERT INTO public.revisions VALUES ('{"host": "postgres-connection", "name": null, "port": 5432, "ssl_ca": null, "db_name": "world-db", "username": "world", "ssl_enable": false, "table_name": null, "cache_ttl_sec": null, "mdb_folder_id": null, "raw_sql_level": "dashsql", "mdb_cluster_id": null, "enforce_collate": "auto", "sample_table_name": null, "data_export_forbidden": false}', '{"state": "saved", "version": 11, "mdb_folder_id": null, "version_minor": 0, "mdb_cluster_id": null}', 'uid:systemId', '2023-08-21 15:40:45.948583+00', 'uid:systemId', '2023-08-21 15:40:45.948583+00', 1492152554765681667, 1492152554757293058, '{}');
INSERT INTO public.revisions VALUES ('{"rls": [], "name": "", "revision_id": null, "result_schema": [{"cast": "string", "guid": "code", "type": "DIMENSION", "title": "code", "valid": true, "hidden": false, "source": "code", "formula": "", "avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "string", "guid": "name", "type": "DIMENSION", "title": "name", "valid": true, "hidden": false, "source": "name", "formula": "", "avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "string", "guid": "continent", "type": "DIMENSION", "title": "continent", "valid": true, "hidden": false, "source": "continent", "formula": "", "avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "string", "guid": "region", "type": "DIMENSION", "title": "region", "valid": true, "hidden": false, "source": "region", "formula": "", "avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "float", "guid": "surface_area", "type": "DIMENSION", "title": "surface_area", "valid": true, "hidden": false, "source": "surface_area", "formula": "", "avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "float", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "float", "has_auto_aggregation": false}, {"cast": "integer", "guid": "indep_year", "type": "DIMENSION", "title": "indep_year", "valid": true, "hidden": false, "source": "indep_year", "formula": "", "avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "integer", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "integer", "has_auto_aggregation": false}, {"cast": "integer", "guid": "population", "type": "DIMENSION", "title": "population", "valid": true, "hidden": false, "source": "population", "formula": "", "avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "integer", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "integer", "has_auto_aggregation": false}, {"cast": "float", "guid": "life_expectancy", "type": "DIMENSION", "title": "life_expectancy", "valid": true, "hidden": false, "source": "life_expectancy", "formula": "", "avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "float", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "float", "has_auto_aggregation": false}, {"cast": "float", "guid": "gnp", "type": "DIMENSION", "title": "gnp", "valid": true, "hidden": false, "source": "gnp", "formula": "", "avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "float", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "float", "has_auto_aggregation": false}, {"cast": "float", "guid": "gnp_old", "type": "DIMENSION", "title": "gnp_old", "valid": true, "hidden": false, "source": "gnp_old", "formula": "", "avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "float", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "float", "has_auto_aggregation": false}, {"cast": "string", "guid": "local_name", "type": "DIMENSION", "title": "local_name", "valid": true, "hidden": false, "source": "local_name", "formula": "", "avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "string", "guid": "government_form", "type": "DIMENSION", "title": "government_form", "valid": true, "hidden": false, "source": "government_form", "formula": "", "avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "string", "guid": "head_of_state", "type": "DIMENSION", "title": "head_of_state", "valid": true, "hidden": false, "source": "head_of_state", "formula": "", "avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "integer", "guid": "capital", "type": "DIMENSION", "title": "capital", "valid": true, "hidden": false, "source": "capital", "formula": "", "avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "integer", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "integer", "has_auto_aggregation": false}, {"cast": "string", "guid": "code2", "type": "DIMENSION", "title": "code2", "valid": true, "hidden": false, "source": "code2", "formula": "", "avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "integer", "guid": "id", "type": "DIMENSION", "title": "id", "valid": true, "hidden": false, "source": "id", "formula": "", "avatar_id": "228fff80-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "integer", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "integer", "has_auto_aggregation": false}, {"cast": "string", "guid": "name_1", "type": "DIMENSION", "title": "name (1)", "valid": true, "hidden": false, "source": "name", "formula": "", "avatar_id": "228fff80-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "string", "guid": "country_code", "type": "DIMENSION", "title": "country_code", "valid": true, "hidden": false, "source": "country_code", "formula": "", "avatar_id": "228fff80-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "string", "guid": "district", "type": "DIMENSION", "title": "district", "valid": true, "hidden": false, "source": "district", "formula": "", "avatar_id": "228fff80-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "integer", "guid": "population_1", "type": "DIMENSION", "title": "population (1)", "valid": true, "hidden": false, "source": "population", "formula": "", "avatar_id": "228fff80-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "integer", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "integer", "has_auto_aggregation": false}, {"cast": "string", "guid": "local_name_1", "type": "DIMENSION", "title": "local_name (1)", "valid": true, "hidden": false, "source": "local_name", "formula": "", "avatar_id": "228fff80-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "string", "guid": "code2_1", "type": "DIMENSION", "title": "code2 (1)", "valid": true, "hidden": false, "source": "code2", "formula": "", "avatar_id": "29422ba0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "string", "guid": "emoji", "type": "DIMENSION", "title": "emoji", "valid": true, "hidden": false, "source": "emoji", "formula": "", "avatar_id": "29422ba0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "string", "guid": "unicode", "type": "DIMENSION", "title": "unicode", "valid": true, "hidden": false, "source": "unicode", "formula": "", "avatar_id": "29422ba0-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "string", "guid": "country_code_1", "type": "DIMENSION", "title": "country_code (1)", "valid": true, "hidden": false, "source": "country_code", "formula": "", "avatar_id": "34194950-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "string", "guid": "language", "type": "DIMENSION", "title": "language", "valid": true, "hidden": false, "source": "language", "formula": "", "avatar_id": "34194950-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "string", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "string", "has_auto_aggregation": false}, {"cast": "boolean", "guid": "is_official", "type": "DIMENSION", "title": "is_official", "valid": true, "hidden": false, "source": "is_official", "formula": "", "avatar_id": "34194950-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "boolean", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "boolean", "has_auto_aggregation": false}, {"cast": "float", "guid": "percentage", "type": "DIMENSION", "title": "percentage", "valid": true, "hidden": false, "source": "percentage", "formula": "", "avatar_id": "34194950-4039-11ee-80e9-6bd23c6218d3", "calc_mode": "direct", "data_type": "float", "managed_by": "user", "aggregation": "none", "description": "", "guid_formula": "", "default_value": null, "lock_aggregation": false, "value_constraint": null, "initial_data_type": "float", "has_auto_aggregation": false}], "source_avatars": [{"id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "title": "public.country", "valid": true, "is_root": true, "source_id": "21c5d1b1-4039-11ee-80e9-6bd23c6218d3", "managed_by": "user"}, {"id": "228fff80-4039-11ee-80e9-6bd23c6218d3", "title": "public.city", "valid": true, "is_root": false, "source_id": "228fff82-4039-11ee-80e9-6bd23c6218d3", "managed_by": "user"}, {"id": "29422ba0-4039-11ee-80e9-6bd23c6218d3", "title": "public.country_flag", "valid": true, "is_root": false, "source_id": "29422ba2-4039-11ee-80e9-6bd23c6218d3", "managed_by": "user"}, {"id": "34194950-4039-11ee-80e9-6bd23c6218d3", "title": "public.country_language", "valid": true, "is_root": false, "source_id": "34197060-4039-11ee-80e9-6bd23c6218d3", "managed_by": "user"}], "avatar_relations": [{"id": "228fff81-4039-11ee-80e9-6bd23c6218d3", "valid": true, "join_type": "inner", "conditions": [{"operator": "eq", "left_part": {"source": "code", "calc_mode": "direct"}, "right_part": {"source": "country_code", "calc_mode": "direct"}, "condition_type": "binary"}], "managed_by": "user", "left_avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "right_avatar_id": "228fff80-4039-11ee-80e9-6bd23c6218d3"}, {"id": "29422ba1-4039-11ee-80e9-6bd23c6218d3", "valid": true, "join_type": "inner", "conditions": [{"operator": "eq", "left_part": {"source": "code2", "calc_mode": "direct"}, "right_part": {"source": "code2", "calc_mode": "direct"}, "condition_type": "binary"}], "managed_by": "user", "left_avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "right_avatar_id": "29422ba0-4039-11ee-80e9-6bd23c6218d3"}, {"id": "34194951-4039-11ee-80e9-6bd23c6218d3", "valid": true, "join_type": "inner", "conditions": [{"operator": "eq", "left_part": {"source": "code", "calc_mode": "direct"}, "right_part": {"source": "country_code", "calc_mode": "direct"}, "condition_type": "binary"}], "managed_by": "user", "left_avatar_id": "21c5d1b0-4039-11ee-80e9-6bd23c6218d3", "right_avatar_id": "34194950-4039-11ee-80e9-6bd23c6218d3"}], "component_errors": {"items": []}, "result_schema_aux": {"inter_dependencies": {"deps": []}}, "obligatory_filters": [], "source_collections": [{"id": "21c5d1b1-4039-11ee-80e9-6bd23c6218d3", "type": "collection", "title": "country", "valid": true, "origin": {"parameters": {"db_version": "PostgreSQL 15.4 (Debian 15.4-1.pgdg120+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 12.2.0-14) 12.2.0, 64-bit", "table_name": "country", "schema_name": "public"}, "raw_schema": [{"name": "code", "type": "string", "title": "code", "nullable": false, "description": "", "native_type": {"name": "char", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "name", "type": "string", "title": "name", "nullable": false, "description": "", "native_type": {"name": "text", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "continent", "type": "string", "title": "continent", "nullable": false, "description": "", "native_type": {"name": "text", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "region", "type": "string", "title": "region", "nullable": false, "description": "", "native_type": {"name": "text", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "surface_area", "type": "float", "title": "surface_area", "nullable": false, "description": "", "native_type": {"name": "real", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "indep_year", "type": "integer", "title": "indep_year", "nullable": true, "description": "", "native_type": {"name": "smallint", "nullable": true, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "population", "type": "integer", "title": "population", "nullable": false, "description": "", "native_type": {"name": "integer", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "life_expectancy", "type": "float", "title": "life_expectancy", "nullable": true, "description": "", "native_type": {"name": "real", "nullable": true, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "gnp", "type": "float", "title": "gnp", "nullable": true, "description": "", "native_type": {"name": "numeric", "nullable": true, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "gnp_old", "type": "float", "title": "gnp_old", "nullable": true, "description": "", "native_type": {"name": "numeric", "nullable": true, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "local_name", "type": "string", "title": "local_name", "nullable": false, "description": "", "native_type": {"name": "text", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "government_form", "type": "string", "title": "government_form", "nullable": false, "description": "", "native_type": {"name": "text", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "head_of_state", "type": "string", "title": "head_of_state", "nullable": true, "description": "", "native_type": {"name": "text", "nullable": true, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "capital", "type": "integer", "title": "capital", "nullable": true, "description": "", "native_type": {"name": "integer", "nullable": true, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "code2", "type": "string", "title": "code2", "nullable": false, "description": "", "native_type": {"name": "char", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}], "created_from": "PG_TABLE", "connection_id": "xyqxja1rtcbgm"}, "sample": null, "managed_by": "user", "materialization": null}, {"id": "228fff82-4039-11ee-80e9-6bd23c6218d3", "type": "collection", "title": "city", "valid": true, "origin": {"parameters": {"db_version": "PostgreSQL 15.4 (Debian 15.4-1.pgdg120+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 12.2.0-14) 12.2.0, 64-bit", "table_name": "city", "schema_name": "public"}, "raw_schema": [{"name": "id", "type": "integer", "title": "id", "nullable": false, "description": "", "native_type": {"name": "integer", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "name", "type": "string", "title": "name", "nullable": false, "description": "", "native_type": {"name": "text", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "country_code", "type": "string", "title": "country_code", "nullable": false, "description": "", "native_type": {"name": "char", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "district", "type": "string", "title": "district", "nullable": false, "description": "", "native_type": {"name": "text", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "population", "type": "integer", "title": "population", "nullable": false, "description": "", "native_type": {"name": "integer", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "local_name", "type": "string", "title": "local_name", "nullable": true, "description": "", "native_type": {"name": "text", "nullable": true, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}], "created_from": "PG_TABLE", "connection_id": "xyqxja1rtcbgm"}, "sample": null, "managed_by": "user", "materialization": null}, {"id": "29422ba2-4039-11ee-80e9-6bd23c6218d3", "type": "collection", "title": "country_flag", "valid": true, "origin": {"parameters": {"db_version": "PostgreSQL 15.4 (Debian 15.4-1.pgdg120+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 12.2.0-14) 12.2.0, 64-bit", "table_name": "country_flag", "schema_name": "public"}, "raw_schema": [{"name": "code2", "type": "string", "title": "code2", "nullable": false, "description": "", "native_type": {"name": "char", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "emoji", "type": "string", "title": "emoji", "nullable": false, "description": "", "native_type": {"name": "text", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "unicode", "type": "string", "title": "unicode", "nullable": true, "description": "", "native_type": {"name": "text", "nullable": true, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}], "created_from": "PG_TABLE", "connection_id": "xyqxja1rtcbgm"}, "sample": null, "managed_by": "user", "materialization": null}, {"id": "34197060-4039-11ee-80e9-6bd23c6218d3", "type": "collection", "title": "country_language", "valid": true, "origin": {"parameters": {"db_version": "PostgreSQL 15.4 (Debian 15.4-1.pgdg120+1) on x86_64-pc-linux-gnu, compiled by gcc (Debian 12.2.0-14) 12.2.0, 64-bit", "table_name": "country_language", "schema_name": "public"}, "raw_schema": [{"name": "country_code", "type": "string", "title": "country_code", "nullable": false, "description": "", "native_type": {"name": "char", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "language", "type": "string", "title": "language", "nullable": false, "description": "", "native_type": {"name": "text", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "is_official", "type": "boolean", "title": "is_official", "nullable": false, "description": "", "native_type": {"name": "boolean", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}, {"name": "percentage", "type": "float", "title": "percentage", "nullable": false, "description": "", "native_type": {"name": "real", "nullable": false, "conn_type": "postgres", "native_type_class_name": "common_native_type"}, "lock_aggregation": false, "has_auto_aggregation": false}], "created_from": "PG_TABLE", "connection_id": "xyqxja1rtcbgm"}, "sample": null, "managed_by": "user", "materialization": null}]}', '{"version": 11, "created_via": "user", "version_minor": 0}', 'uid:systemId', '2023-08-21 15:41:54.001492+00', 'uid:systemId', '2023-08-21 15:41:54.001492+00', 1492153125627233285, 1492153125602067460, '{"21c5d1b1-4039-11ee-80e9-6bd23c6218d3": "xyqxja1rtcbgm", "228fff82-4039-11ee-80e9-6bd23c6218d3": "xyqxja1rtcbgm", "29422ba2-4039-11ee-80e9-6bd23c6218d3": "xyqxja1rtcbgm", "34197060-4039-11ee-80e9-6bd23c6218d3": "xyqxja1rtcbgm"}');
INSERT INTO public.revisions VALUES ('{"js": "\nconst {buildGraph} = require(''libs/datalens/v3'');\n\nconst result = buildGraph({\n    apiVersion: ''2'',\n    data: ChartEditor.getLoadedData(),\n    shared: ChartEditor.getSharedData(),\n    params: ChartEditor.getParams(),\n    actionParams: ChartEditor.getActionParams(),\n    ChartEditor,\n});\n\n// your code here\n\nmodule.exports = result;\n", "ui": "\nconst {buildUI} = require(''libs/datalens/v3'');\n\nif (buildUI) {\n    const result = buildUI({\n        shared: ChartEditor.getSharedData(),\n        params: ChartEditor.getParams(),\n        actionParams: ChartEditor.getActionParams(),\n        ChartEditor\n    });\n\n    // your code here\n\n    module.exports = result;\n}\n", "url": "\nconst {buildSources} = require(''libs/datalens/v3'');\n\nconst result = buildSources({\n    apiVersion: ''2'',\n    shared: ChartEditor.getSharedData(),\n    params: ChartEditor.getParams(),\n    ChartEditor\n});\n\n// your code here\n\nmodule.exports = result;\n", "table": "\nconst {buildChartsConfig} = require(''libs/datalens/v3'');\n\nconst result = buildChartsConfig({\n    shared: ChartEditor.getSharedData(),\n    params: ChartEditor.getParams(),\n    actionParams: ChartEditor.getActionParams(),\n    ChartEditor\n});\n\n// your code here\n\nmodule.exports = result;\n", "params": "\nconst {buildParams} = require(''libs/datalens/v3'');\n\nif (buildParams) {\n    const result = buildParams({\n        shared: ChartEditor.getSharedData(),\n        ChartEditor\n    });\n\n    // your code here\n\n    module.exports = result;\n} else {\n    // your code here\n\n    module.exports = {};\n}\n", "shared": "{\n    \"colors\": [],\n    \"colorsConfig\": {},\n    \"datasetsIds\": [\n        \"z0s0smbj41ago\"\n    ],\n    \"datasetsPartialFields\": [\n        [\n            {\n                \"guid\": \"code\",\n                \"title\": \"code\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"name\",\n                \"title\": \"name\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"continent\",\n                \"title\": \"continent\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"region\",\n                \"title\": \"region\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"surface_area\",\n                \"title\": \"surface_area\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"indep_year\",\n                \"title\": \"indep_year\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"population\",\n                \"title\": \"population\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"life_expectancy\",\n                \"title\": \"life_expectancy\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"gnp\",\n                \"title\": \"gnp\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"gnp_old\",\n                \"title\": \"gnp_old\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"local_name\",\n                \"title\": \"local_name\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"government_form\",\n                \"title\": \"government_form\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"head_of_state\",\n                \"title\": \"head_of_state\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"capital\",\n                \"title\": \"capital\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"code2\",\n                \"title\": \"code2\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"id\",\n                \"title\": \"id\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"name_1\",\n                \"title\": \"name (1)\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"country_code\",\n                \"title\": \"country_code\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"district\",\n                \"title\": \"district\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"population_1\",\n                \"title\": \"population (1)\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"local_name_1\",\n                \"title\": \"local_name (1)\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"code2_1\",\n                \"title\": \"code2 (1)\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"emoji\",\n                \"title\": \"emoji\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"unicode\",\n                \"title\": \"unicode\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"country_code_1\",\n                \"title\": \"country_code (1)\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"language\",\n                \"title\": \"language\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"is_official\",\n                \"title\": \"is_official\",\n                \"calc_mode\": \"direct\"\n            },\n            {\n                \"guid\": \"percentage\",\n                \"title\": \"percentage\",\n                \"calc_mode\": \"direct\"\n            }\n        ]\n    ],\n    \"extraSettings\": {\n        \"pagination\": \"on\",\n        \"limit\": 100\n    },\n    \"filters\": [],\n    \"geopointsConfig\": {},\n    \"hierarchies\": [],\n    \"labels\": [],\n    \"links\": [],\n    \"segments\": [],\n    \"shapes\": [],\n    \"shapesConfig\": {},\n    \"sort\": [\n        {\n            \"guid\": \"population\",\n            \"datasetId\": \"z0s0smbj41ago\",\n            \"data_type\": \"integer\",\n            \"title\": \"population\",\n            \"source\": \"population\",\n            \"direction\": \"DESC\",\n            \"type\": \"DIMENSION\"\n        },\n        {\n            \"guid\": \"life_expectancy\",\n            \"datasetId\": \"z0s0smbj41ago\",\n            \"data_type\": \"float\",\n            \"title\": \"life_expectancy\",\n            \"source\": \"life_expectancy\",\n            \"direction\": \"DESC\",\n            \"type\": \"DIMENSION\"\n        },\n        {\n            \"guid\": \"gnp\",\n            \"datasetId\": \"z0s0smbj41ago\",\n            \"data_type\": \"float\",\n            \"title\": \"gnp\",\n            \"source\": \"gnp\",\n            \"direction\": \"DESC\",\n            \"type\": \"DIMENSION\"\n        }\n    ],\n    \"tooltips\": [],\n    \"type\": \"datalens\",\n    \"updates\": [],\n    \"version\": \"9\",\n    \"visualization\": {\n        \"id\": \"flatTable\",\n        \"type\": \"table\",\n        \"name\": \"label_visualization-flat-table\",\n        \"iconProps\": {\n            \"id\": \"visFlatTable\",\n            \"width\": \"24\"\n        },\n        \"allowFilters\": true,\n        \"allowColors\": true,\n        \"allowSort\": true,\n        \"placeholders\": [\n            {\n                \"allowedTypes\": {},\n                \"id\": \"flat-table-columns\",\n                \"type\": \"flat-table-columns\",\n                \"title\": \"section_columns\",\n                \"iconProps\": {},\n                \"items\": [\n                    {\n                        \"aggregation\": \"none\",\n                        \"data_type\": \"string\",\n                        \"aggregation_locked\": false,\n                        \"guid\": \"name\",\n                        \"hidden\": false,\n                        \"type\": \"DIMENSION\",\n                        \"autoaggregated\": false,\n                        \"cast\": \"string\",\n                        \"lock_aggregation\": false,\n                        \"valid\": true,\n                        \"description\": \"\",\n                        \"managed_by\": \"user\",\n                        \"virtual\": false,\n                        \"has_auto_aggregation\": false,\n                        \"title\": \"name\",\n                        \"initial_data_type\": \"string\",\n                        \"avatar_id\": \"21c5d1b0-4039-11ee-80e9-6bd23c6218d3\",\n                        \"source\": \"name\",\n                        \"calc_mode\": \"direct\",\n                        \"formula\": \"\",\n                        \"guid_formula\": \"\",\n                        \"default_value\": null,\n                        \"value_constraint\": null,\n                        \"datasetId\": \"z0s0smbj41ago\",\n                        \"id\": \"dimension-1\",\n                        \"datasetName\": \"Dataset\"\n                    },\n                    {\n                        \"aggregation\": \"none\",\n                        \"data_type\": \"string\",\n                        \"aggregation_locked\": false,\n                        \"guid\": \"emoji\",\n                        \"hidden\": false,\n                        \"type\": \"DIMENSION\",\n                        \"autoaggregated\": false,\n                        \"cast\": \"string\",\n                        \"lock_aggregation\": false,\n                        \"valid\": true,\n                        \"description\": \"\",\n                        \"managed_by\": \"user\",\n                        \"virtual\": false,\n                        \"has_auto_aggregation\": false,\n                        \"title\": \"emoji\",\n                        \"initial_data_type\": \"string\",\n                        \"avatar_id\": \"29422ba0-4039-11ee-80e9-6bd23c6218d3\",\n                        \"source\": \"emoji\",\n                        \"calc_mode\": \"direct\",\n                        \"formula\": \"\",\n                        \"guid_formula\": \"\",\n                        \"default_value\": null,\n                        \"value_constraint\": null,\n                        \"datasetId\": \"z0s0smbj41ago\",\n                        \"id\": \"dimension-22\",\n                        \"datasetName\": \"Dataset\"\n                    },\n                    {\n                        \"aggregation\": \"none\",\n                        \"data_type\": \"integer\",\n                        \"aggregation_locked\": false,\n                        \"guid\": \"population\",\n                        \"hidden\": false,\n                        \"type\": \"DIMENSION\",\n                        \"autoaggregated\": false,\n                        \"cast\": \"integer\",\n                        \"lock_aggregation\": false,\n                        \"valid\": true,\n                        \"description\": \"\",\n                        \"managed_by\": \"user\",\n                        \"virtual\": false,\n                        \"has_auto_aggregation\": false,\n                        \"title\": \"population\",\n                        \"initial_data_type\": \"integer\",\n                        \"avatar_id\": \"21c5d1b0-4039-11ee-80e9-6bd23c6218d3\",\n                        \"source\": \"population\",\n                        \"calc_mode\": \"direct\",\n                        \"formula\": \"\",\n                        \"guid_formula\": \"\",\n                        \"default_value\": null,\n                        \"value_constraint\": null,\n                        \"datasetId\": \"z0s0smbj41ago\",\n                        \"id\": \"dimension-6\",\n                        \"datasetName\": \"Dataset\"\n                    },\n                    {\n                        \"aggregation\": \"none\",\n                        \"data_type\": \"float\",\n                        \"aggregation_locked\": false,\n                        \"guid\": \"life_expectancy\",\n                        \"hidden\": false,\n                        \"type\": \"DIMENSION\",\n                        \"autoaggregated\": false,\n                        \"cast\": \"float\",\n                        \"lock_aggregation\": false,\n                        \"valid\": true,\n                        \"description\": \"\",\n                        \"managed_by\": \"user\",\n                        \"virtual\": false,\n                        \"has_auto_aggregation\": false,\n                        \"title\": \"life_expectancy\",\n                        \"initial_data_type\": \"float\",\n                        \"avatar_id\": \"21c5d1b0-4039-11ee-80e9-6bd23c6218d3\",\n                        \"source\": \"life_expectancy\",\n                        \"calc_mode\": \"direct\",\n                        \"formula\": \"\",\n                        \"guid_formula\": \"\",\n                        \"default_value\": null,\n                        \"value_constraint\": null,\n                        \"datasetId\": \"z0s0smbj41ago\",\n                        \"id\": \"dimension-7\",\n                        \"datasetName\": \"Dataset\"\n                    },\n                    {\n                        \"aggregation\": \"none\",\n                        \"data_type\": \"float\",\n                        \"aggregation_locked\": false,\n                        \"guid\": \"gnp\",\n                        \"hidden\": false,\n                        \"type\": \"DIMENSION\",\n                        \"autoaggregated\": false,\n                        \"cast\": \"float\",\n                        \"lock_aggregation\": false,\n                        \"valid\": true,\n                        \"description\": \"\",\n                        \"managed_by\": \"user\",\n                        \"virtual\": false,\n                        \"has_auto_aggregation\": false,\n                        \"title\": \"gnp\",\n                        \"initial_data_type\": \"float\",\n                        \"avatar_id\": \"21c5d1b0-4039-11ee-80e9-6bd23c6218d3\",\n                        \"source\": \"gnp\",\n                        \"calc_mode\": \"direct\",\n                        \"formula\": \"\",\n                        \"guid_formula\": \"\",\n                        \"default_value\": null,\n                        \"value_constraint\": null,\n                        \"datasetId\": \"z0s0smbj41ago\",\n                        \"id\": \"dimension-8\",\n                        \"datasetName\": \"Dataset\"\n                    }\n                ],\n                \"required\": true,\n                \"settings\": {\n                    \"groupping\": \"on\",\n                    \"axisModeMap\": {\n                        \"name\": \"discrete\"\n                    }\n                }\n            }\n        ],\n        \"allowLayerFilters\": false\n    },\n    \"convert\": false\n}"}', '{}', 'uid:systemId', '2023-08-21 15:43:32.199456+00', 'uid:systemId', '2023-08-21 15:43:32.199456+00', 1492153949346595847, 1492153949346595846, '{"dataset": "z0s0smbj41ago"}');
INSERT INTO public.revisions VALUES ('{"salt": "0.5127953590097551", "tabs": [{"id": "Yr", "items": [], "title": "Tab 1", "layout": [], "aliases": {}, "connections": []}], "counter": 2, "settings": {"hideTabs": false, "expandTOC": false, "hideDashTitle": false, "silentLoading": false, "autoupdateInterval": null, "dependentSelectors": true, "maxConcurrentRequests": null}, "schemeVersion": 7}', NULL, 'uid:systemId', '2023-08-21 15:43:42.169089+00', 'uid:systemId', '2023-08-21 15:43:42.169089+00', 1492154032972629000, 1492154032972629001, '{}');
INSERT INTO public.revisions VALUES ('{"salt": "0.5127953590097551", "tabs": [{"id": "Yr", "items": [{"id": "Vg", "data": {"size": "l", "text": "Am I real?", "showInTOC": true}, "type": "title", "namespace": "default"}, {"id": "kb", "data": {"title": "emoji", "source": {"datasetId": "z0s0smbj41ago", "fieldType": "string", "showTitle": true, "elementType": "select", "datasetFieldId": "emoji", "datasetFieldType": "DIMENSION"}, "sourceType": "dataset"}, "type": "control", "defaults": {"emoji": ""}, "namespace": "default"}, {"id": "wr", "data": {"title": "life_expectancy", "source": {"datasetId": "z0s0smbj41ago", "fieldType": "float", "operation": "GT", "showTitle": true, "innerTitle": ">", "elementType": "input", "defaultValue": "65", "datasetFieldId": "life_expectancy", "datasetFieldType": "DIMENSION"}, "sourceType": "dataset"}, "type": "control", "defaults": {"life_expectancy": "__gt_65"}, "namespace": "default"}, {"id": "mv", "data": {"tabs": [{"id": "bK", "title": "Countries chart", "params": {}, "chartId": "lmemprddypv8a", "isDefault": true, "autoHeight": false}], "hideTitle": false}, "type": "widget", "namespace": "default"}], "title": "Tab 1", "layout": [{"h": 2, "i": "Vg", "w": 36, "x": 0, "y": 0}, {"h": 2, "i": "kb", "w": 8, "x": 0, "y": 2}, {"h": 2, "i": "wr", "w": 8, "x": 8, "y": 2}, {"h": 19, "i": "mv", "w": 36, "x": 0, "y": 4}], "aliases": {}, "connections": []}], "counter": 7, "settings": {"hideTabs": false, "expandTOC": false, "hideDashTitle": false, "silentLoading": false, "autoupdateInterval": null, "dependentSelectors": true, "maxConcurrentRequests": null}, "schemeVersion": 7}', '{"is_release": true}', 'uid:systemId', '2023-08-21 15:45:01.021461+00', 'uid:systemId', '2023-08-21 15:45:01.021461+00', 1492154694464701451, 1492154032972629001, '{"lmemprddypv8a": "lmemprddypv8a", "z0s0smbj41ago": "z0s0smbj41ago"}');
INSERT INTO public.revisions VALUES ('{"salt": "0.5127953590097551", "tabs": [{"id": "Yr", "items": [{"id": "Vg", "data": {"size": "l", "text": "Am I real?", "showInTOC": true}, "type": "title", "namespace": "default"}, {"id": "kb", "data": {"title": "Country", "source": {"datasetId": "z0s0smbj41ago", "fieldType": "string", "showTitle": true, "elementType": "select", "datasetFieldId": "emoji", "datasetFieldType": "DIMENSION"}, "sourceType": "dataset"}, "type": "control", "defaults": {"emoji": ""}, "namespace": "default"}, {"id": "wr", "data": {"title": "Life expectancy >", "source": {"datasetId": "z0s0smbj41ago", "fieldType": "float", "operation": "GT", "showTitle": true, "innerTitle": ">", "elementType": "input", "defaultValue": "65", "datasetFieldId": "life_expectancy", "datasetFieldType": "DIMENSION"}, "sourceType": "dataset"}, "type": "control", "defaults": {"life_expectancy": "__gt_65"}, "namespace": "default"}, {"id": "mv", "data": {"tabs": [{"id": "bK", "title": "Countries chart", "params": {}, "chartId": "lmemprddypv8a", "isDefault": true, "autoHeight": false}], "hideTitle": false}, "type": "widget", "namespace": "default"}], "title": "Tab 1", "layout": [{"h": 2, "i": "Vg", "w": 36, "x": 0, "y": 0}, {"h": 2, "i": "kb", "w": 8, "x": 0, "y": 2}, {"h": 2, "i": "wr", "w": 8, "x": 8, "y": 2}, {"h": 19, "i": "mv", "w": 36, "x": 0, "y": 4}], "aliases": {}, "connections": []}], "counter": 7, "settings": {"hideTabs": false, "expandTOC": false, "hideDashTitle": false, "silentLoading": false, "autoupdateInterval": null, "dependentSelectors": true, "maxConcurrentRequests": null}, "schemeVersion": 7}', '{"is_release": true}', 'uid:systemId', '2023-08-21 15:45:46.913361+00', 'uid:systemId', '2023-08-21 15:45:46.913361+00', 1492155079443088397, 1492154032972629001, '{"lmemprddypv8a": "lmemprddypv8a", "z0s0smbj41ago": "z0s0smbj41ago"}');
INSERT INTO public.revisions VALUES ('{"host": "postgres-connection", "name": null, "port": 5432, "ssl_ca": null, "db_name": "world-db", "username": "world", "ssl_enable": false, "table_name": null, "cache_ttl_sec": null, "mdb_folder_id": null, "raw_sql_level": "dashsql", "mdb_cluster_id": null, "enforce_collate": "auto", "sample_table_name": null, "data_export_forbidden": false}', '{"state": "saved", "version": 11, "mdb_folder_id": null, "version_minor": 0, "mdb_cluster_id": null}', 'uid:systemId', '2023-08-24 11:00:52.415607+00', 'uid:systemId', '2023-08-24 11:00:52.415607+00', 1494186007585621007, 1492152554757293058, '{}');



INSERT INTO public.states VALUES ('27bcbfbe100', 1492154032972629001, '{"kb": {"params": {"emoji": "🇦🇩"}}, "__meta__": {"queue": [{"id": "kb"}], "version": 2}}', '2023-08-21 15:45:05.129288+00');
INSERT INTO public.states VALUES ('73c39a8c96', 1492154032972629001, '{"kb": {"params": {"emoji": ""}}, "__meta__": {"queue": [{"id": "kb"}], "version": 2}}', '2023-08-21 15:45:09.513878+00');
INSERT INTO public.states VALUES ('d6a67a11153', 1492154032972629001, '{"kb": {"params": {"emoji": ""}}, "wr": {"params": {"life_expectancy": "__gt_5"}}, "__meta__": {"queue": [{"id": "kb"}, {"id": "wr"}], "version": 2}}', '2023-08-21 15:45:15.716141+00');






INSERT INTO public.tenants VALUES ('common', '{}', '2021-09-01 15:00:00+00', true, false, '2023-08-21 15:38:22.669075+00', 0, false, true);






INSERT INTO public.workbooks VALUES (1492152097326498817, 'Workbook', 'What an amazing workbook!', NULL, 'common', '{}', 'systemId', '2023-08-21 15:39:51.383601+00', NULL, false, NULL, NULL, 'systemId', '2023-08-21 15:39:51.383601+00', 'workbook', '\x576f726b626f6f6b');



SELECT pg_catalog.setval('public.counter_seq', 15, true);



SELECT pg_catalog.setval('public.migrations_id_seq', 65, true);



SELECT pg_catalog.setval('public.migrations_lock_index_seq', 1, true);



ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (collection_id);



ALTER TABLE ONLY public.color_palettes
    ADD CONSTRAINT color_palettes_pkey PRIMARY KEY (color_palette_id);



ALTER TABLE ONLY public.color_palettes
    ADD CONSTRAINT color_palettes_uniq_name_constraint UNIQUE (tenant_id, name);



ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.embedding_secrets
    ADD CONSTRAINT embedding_secrets_pkey PRIMARY KEY (embedding_secret_id);



ALTER TABLE ONLY public.embeds
    ADD CONSTRAINT embeds_pkey PRIMARY KEY (embed_id);



ALTER TABLE ONLY public.entries
    ADD CONSTRAINT entries_pkey PRIMARY KEY (entry_id);



ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (entry_id, login);



ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_pkey PRIMARY KEY (from_id, to_id, name);



ALTER TABLE ONLY public.locks
    ADD CONSTRAINT locks_pkey PRIMARY KEY (lock_id);



ALTER TABLE ONLY public.migrations_lock
    ADD CONSTRAINT migrations_lock_pkey PRIMARY KEY (index);



ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.migrations_tenants
    ADD CONSTRAINT migrations_tenants_pkey PRIMARY KEY (from_id, to_id);



ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_pkey PRIMARY KEY (operation_id);



ALTER TABLE ONLY public.presets
    ADD CONSTRAINT presets_pkey PRIMARY KEY (preset_id);



ALTER TABLE ONLY public.revisions
    ADD CONSTRAINT revisions_pkey PRIMARY KEY (rev_id);



ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_pkey PRIMARY KEY (hash, entry_id);



ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (name);



ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (tenant_id);



ALTER TABLE ONLY public.locks
    ADD CONSTRAINT uniq_active_lock_per_entry_id EXCLUDE USING gist (entry_id WITH =, tstzrange(start_date, expiry_date) WITH &&) WHERE ((expiry_date > start_date));



ALTER TABLE ONLY public.entries
    ADD CONSTRAINT uniq_scope_name_workbook_id UNIQUE (scope, name, workbook_id);



ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (user_id);



ALTER TABLE ONLY public.workbooks
    ADD CONSTRAINT workbooks_pkey PRIMARY KEY (workbook_id);



CREATE INDEX collections_parent_id_idx ON public.collections USING btree (parent_id);



CREATE INDEX collections_project_id_idx ON public.collections USING btree (project_id);



CREATE INDEX collections_sort_title_idx ON public.collections USING btree (sort_title);



CREATE INDEX collections_tenant_id_idx ON public.collections USING btree (tenant_id);



CREATE UNIQUE INDEX collections_uniq_title_idx ON public.collections USING btree (COALESCE((parent_id)::text, project_id, tenant_id), title_lower) WHERE (deleted_at IS NULL);



CREATE INDEX color_palettes_tenant_id_idx ON public.color_palettes USING btree (tenant_id);



CREATE UNIQUE INDEX color_palettes_uniq_default_for_tenant_id_idx ON public.color_palettes USING btree (tenant_id, is_default, is_gradient) WHERE (is_default = true);



CREATE INDEX comments_is_removed_feed_date_date_until_idx ON public.comments USING btree (is_removed, feed, date, date_until);



CREATE INDEX embedding_secrets_workbook_id_idx ON public.embedding_secrets USING btree (workbook_id);



CREATE INDEX embeds_embedding_secret_id_idx ON public.embeds USING btree (embedding_secret_id);



CREATE INDEX embeds_entry_id_idx ON public.embeds USING btree (entry_id);



CREATE INDEX entries_workbook_id_idx ON public.entries USING btree (workbook_id);



CREATE INDEX from_id_idx ON public.links USING btree (from_id);



CREATE INDEX key_idx ON public.entries USING gin (key public.gin_trgm_ops);



CREATE INDEX name_idx ON public.entries USING btree (name);



CREATE INDEX operations_retries_left_run_after_idx ON public.operations USING btree (retries_left, run_after) WHERE (status = 'scheduled'::public.operation_status_enum);



CREATE INDEX public_idx ON public.entries USING btree (public);



CREATE INDEX revisions_entry_id_idx ON public.revisions USING btree (entry_id);



CREATE INDEX revisions_meta_mdb_cluster_id_index ON public.revisions USING gin (((meta ->> 'mdb_cluster_id'::text)));



CREATE INDEX sort_name_idx ON public.entries USING btree (sort_name);



CREATE UNIQUE INDEX tenant_id_key_idx ON public.entries USING btree (tenant_id, key);



CREATE INDEX tenant_id_plus_login_idx ON public.favorites USING btree (tenant_id, login);



CREATE INDEX tenants_enabled_idx ON public.tenants USING btree (enabled);



CREATE UNIQUE INDEX tenants_tenant_id_uindex ON public.tenants USING btree (tenant_id);



CREATE INDEX to_id_idx ON public.links USING btree (to_id);



CREATE INDEX workbooks_collection_id_idx ON public.workbooks USING btree (collection_id);



CREATE INDEX workbooks_project_id_idx ON public.workbooks USING btree (project_id);



CREATE INDEX workbooks_sort_title_idx ON public.workbooks USING btree (sort_title);



CREATE INDEX workbooks_tenant_id_idx ON public.workbooks USING btree (tenant_id);



CREATE UNIQUE INDEX workbooks_uniq_title_idx ON public.workbooks USING btree (COALESCE((collection_id)::text, project_id, tenant_id), title_lower) WHERE (deleted_at IS NULL);



CREATE TRIGGER before_collections_insert_or_update BEFORE INSERT OR UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.update_collections();



CREATE TRIGGER before_entries_insert_or_update BEFORE INSERT OR UPDATE ON public.entries FOR EACH ROW EXECUTE FUNCTION public.update_entries();



CREATE TRIGGER before_workbooks_insert_or_update BEFORE INSERT OR UPDATE ON public.workbooks FOR EACH ROW EXECUTE FUNCTION public.update_workbooks();



ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.collections(collection_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY public.color_palettes
    ADD CONSTRAINT color_palettes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY public.embedding_secrets
    ADD CONSTRAINT embedding_secrets_workbook_id_fkey FOREIGN KEY (workbook_id) REFERENCES public.workbooks(workbook_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY public.embeds
    ADD CONSTRAINT embeds_embedding_secret_id_fkey FOREIGN KEY (embedding_secret_id) REFERENCES public.embedding_secrets(embedding_secret_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY public.embeds
    ADD CONSTRAINT embeds_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.entries(entry_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY public.entries
    ADD CONSTRAINT entries_tenants_id FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY public.entries
    ADD CONSTRAINT entries_workbook_id_ref FOREIGN KEY (workbook_id) REFERENCES public.workbooks(workbook_id) ON DELETE CASCADE;



ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_entries_id FOREIGN KEY (entry_id) REFERENCES public.entries(entry_id) ON DELETE CASCADE;



ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_tenant_id_ref FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY public.locks
    ADD CONSTRAINT locks_entries_id FOREIGN KEY (entry_id) REFERENCES public.entries(entry_id) ON DELETE CASCADE;



ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY public.revisions
    ADD CONSTRAINT revisions_entries_id FOREIGN KEY (entry_id) REFERENCES public.entries(entry_id) ON DELETE CASCADE;



ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_entries_id FOREIGN KEY (entry_id) REFERENCES public.entries(entry_id) ON DELETE CASCADE;



ALTER TABLE ONLY public.workbooks
    ADD CONSTRAINT workbooks_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(collection_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY public.workbooks
    ADD CONSTRAINT workbooks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(tenant_id) ON UPDATE CASCADE ON DELETE CASCADE;

