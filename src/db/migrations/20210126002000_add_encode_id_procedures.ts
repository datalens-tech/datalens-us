import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`

    -- https://stackoverflow.com/questions/5997241
    CREATE OR REPLACE FUNCTION base36_encode (IN digits bigint, IN coding_base char[])
        RETURNS varchar
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
    $$
    LANGUAGE plpgsql
    IMMUTABLE;

    CREATE OR REPLACE FUNCTION encode_id (IN id bigint)
	    RETURNS text
	    AS $$
    DECLARE
        coding_base_str text;
        coding_base_sub1 text;
        coding_base_sub2 text;
        rotation_number int;

        coding_base_initial char[];
        coding_base_rotated char[];

        encoded_id text;
    BEGIN

        rotation_number := MOD(MOD(id, 100), 36);

        coding_base_str := '0123456789abcdefghijklmnopqrstuvwxyz';
        coding_base_sub1 := substring(coding_base_str, rotation_number + 1);
        coding_base_sub2 := substring(coding_base_str, 0, rotation_number + 1);

        coding_base_initial := regexp_split_to_array(coding_base_str, '');
        coding_base_rotated := regexp_split_to_array(concat(coding_base_sub1, coding_base_sub2), '');

        encoded_id := CONCAT(base36_encode(id, coding_base_rotated), base36_encode(rotation_number, coding_base_initial));

        return encoded_id;
    END;
    $$
    LANGUAGE plpgsql
    IMMUTABLE;

    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        DROP FUNCTION base36_encode;
        DROP FUNCTION IF EXISTS encode_id;
    `);
};
