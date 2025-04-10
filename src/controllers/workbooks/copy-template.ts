import {AppRouteHandler, Response} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {copyWorkbookTemplate} from '../../services/new/workbook';

import {
    WorkbookModelWithOperationResponseModel,
    workbookModelWithOperation,
} from './response-models';

const requestSchema = {
    params: z.object({
        workbookId: zc.encodedId(),
    }),
    body: z
        .object({
            collectionId: zc.encodedId().nullable(),
            title: z.string().optional(),
            newTitle: z.string().optional(),
        })
        .superRefine((data, ctx) => {
            const isTitleEmpty = !data.title || data.title.trim() === '';
            const isNewTitleEmpty = !data.newTitle || data.newTitle.trim() === '';
            if (isTitleEmpty && isNewTitleEmpty) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'one of the fields "title" or "newTitle" is required. Both fields cannot be empty',
                });
            }
        }),
};

const parseReq = makeReqParser(requestSchema);

export const copyTemplateController: AppRouteHandler = async (
    req,
    res: Response<WorkbookModelWithOperationResponseModel>,
) => {
    const {body, params} = await parseReq(req);

    const result = await copyWorkbookTemplate(
        {
            ctx: req.ctx,
        },
        {
            workbookId: params.workbookId,
            collectionId: body.collectionId,
            // newTitle for compatibility
            title: (body.title ?? body.newTitle) as string,
        },
    );

    res.status(200).send(workbookModelWithOperation.format(result.workbook, result.operation));
};

copyTemplateController.api = {
    summary: 'Copy template',
    tags: [ApiTag.Workbooks],
    request: {
        params: requestSchema.params,
        body: {
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: requestSchema.body,
                },
            },
        },
    },
    responses: {
        200: {
            description: workbookModelWithOperation.schema.description ?? '',
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: workbookModelWithOperation.schema,
                },
            },
        },
    },
};

copyTemplateController.manualDecodeId = true;
