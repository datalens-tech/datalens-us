import type {Knex} from 'knex';

exports.up = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
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
        last_symbol varchar;
    BEGIN
        -- Last two digits of original bigint id is a rotation_number
        -- We use it to shift encoding dictionary
        rotation_number := MOD(MOD(id, 100), 36);
        -- Splitting encoding dict into two parts in the exact spot
        -- (determined by rotation_number)
        coding_base_str := '0123456789abcdefghijklmnopqrstuvwxyz';
        coding_base_sub1 := substring(coding_base_str, rotation_number + 1);
        coding_base_sub2 := substring(coding_base_str, 0, rotation_number + 1);
        -- Converting original and rotated dictionaries into arrays
        coding_base_initial := regexp_split_to_array(coding_base_str, '');
        coding_base_rotated := regexp_split_to_array(concat(coding_base_sub1, coding_base_sub2), '');

        -- Resulting ID is a concatenation of original ID encoded by rotated dictionary
        -- and one char with with rotation_number encoded by original dictionary (so we can decode it later)
        last_symbol := base36_encode(rotation_number, coding_base_initial);

        IF last_symbol = ''
        THEN
            encoded_id := CONCAT(base36_encode(id, coding_base_rotated), '0');
        ELSE
            encoded_id := CONCAT(base36_encode(id, coding_base_rotated), last_symbol);
        END IF;
        return encoded_id;
    END;
    $$
    LANGUAGE plpgsql
    IMMUTABLE;
    `);
};

exports.down = function (knex: Knex): Promise<unknown> {
    return knex.raw(`
        DROP FUNCTION encode_id;
    `);
};
