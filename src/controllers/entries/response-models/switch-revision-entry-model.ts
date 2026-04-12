import {z} from '../../../components/zod';

const schema = z
    .object({
        isSuccess: z.boolean(),
    })
    .describe('Switch revision entry model');

type SwitchRevisionEntryResult = {
    isSuccess: boolean;
};

const format = (data: SwitchRevisionEntryResult): z.infer<typeof schema> => {
    return {isSuccess: data.isSuccess};
};

export const switchRevisionEntryModel = {
    schema,
    format,
};
