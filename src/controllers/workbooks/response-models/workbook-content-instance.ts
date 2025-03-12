import {z} from '../../../components/zod';
import {JoinedEntryRevisionColumns} from '../../../db/presentations';
import {Permissions as WorkbookPermissions} from '../../../entities/workbook';
import Utils from '../../../utils';

import {workbookEntrySchema} from './workbook-content-model';

const schema = workbookEntrySchema
    .merge(
        z.object({
            permissions: z
                .object({
                    listAccessBindings: z.boolean(),
                    updateAccessBindings: z.boolean(),
                    limitedView: z.boolean(),
                    view: z.boolean(),
                    update: z.boolean(),
                    copy: z.boolean(),
                    move: z.boolean(),
                    publish: z.boolean(),
                    embed: z.boolean(),
                    delete: z.boolean(),
                })
                .optional(),
        }),
    )
    .array()
    .describe('Workbook Content instance');

export type WorkbookContentResponseModel = z.infer<typeof schema>;

const format = (
    entries: (JoinedEntryRevisionColumns & {permissions: WorkbookPermissions})[],
): WorkbookContentResponseModel => {
    return entries.map((data) => ({
        entryId: Utils.encodeId(data.entryId),
        scope: data.scope,
        type: data.type,
        key: data.key,
        displayKey: data.displayKey,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt,
        savedId: Utils.encodeId(data.savedId),
        publishedId: Utils.encodeId(data.publishedId),
        revId: Utils.encodeId(data.revId),
        tenantId: data.tenantId,
        workbookId: Utils.encodeId(data.workbookId),
        data: data.data,
        meta: data.meta,
        links: data.links,
        permissions: data.permissions,
    }));
};

export const workbookContentInstance = {
    schema,
    format,
};
