import {z} from 'zod';

import Utils from '../../../utils';

import {makeIdDecoder} from './utils';

const baseArray = ({min = 0, max = Infinity}: {min?: number; max?: number}) =>
    z.string().array().min(min).max(max);

export const encodedIdArray = ({min, max}: {min: number; max: number}) => {
    return baseArray({min, max}).transform(async (val, ctx) => {
        return Utils.macrotasksMap(val, makeIdDecoder(ctx));
    });
};

export const encodedIdArraySafe = ({min, max}: {min: number; max: number}) => {
    return baseArray({min, max}).transform(async (ids) => {
        const validIds: string[] = [];
        const invalidIds: string[] = [];

        await Utils.macrotasksForEach(ids, (val) => {
            try {
                validIds.push(Utils.decodeId(val));
            } catch (error) {
                invalidIds.push(val);
            }
        });

        return {
            validIds,
            invalidIds,
        };
    });
};
