import {z} from '../../../components/zod';

const schema = z
    .object({
        createCollectionInRoot: z.boolean(),
        createWorkbookInRoot: z.boolean(),
    })
    .describe('Root permissions');

const format = (data: {
    createCollectionInRoot: boolean;
    createWorkbookInRoot: boolean;
}): z.infer<typeof schema> => {
    return data;
};

export const rootPermissions = {
    schema,
    format,
};
