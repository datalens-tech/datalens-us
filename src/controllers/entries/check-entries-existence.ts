import {AppRouteHandler} from '@gravity-ui/expresskit';

import {ApiTag} from '../../components/api-docs';
import {makeReqParser, z, zc} from '../../components/zod';
import {CONTENT_TYPE_JSON} from '../../const';
import {checkEntriesExistence} from '../../services/new/entry';

import {checkEntriesExistenceModel} from './response-models';

const requestSchema = {
    body: z.object({
        entryIds: zc.encodedIdArraySafe({min: 1, max: 1000}),
    }),
};

const parseReq = makeReqParser(requestSchema);

export const checkEntriesExistenceController: AppRouteHandler = async (req, res) => {
    const {body} = await parseReq(req);

    const {decoded: entryIds, failed: invalidEntryIds} = body.entryIds;

    const existing = await checkEntriesExistence(
        {ctx: req.ctx},
        {
            entryIds,
            invalidEntryIds,
        },
    );

    const response = await checkEntriesExistenceModel.format({
        existing,
        decodedEntryIds: entryIds,
        invalidEntryIds,
    });

    res.status(200).send(response);
};

checkEntriesExistenceController.api = {
    summary: 'Check entries existence',
    tags: [ApiTag.Entries],
    request: {
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
            description: `${checkEntriesExistenceModel.schema.description}`,
            content: {
                [CONTENT_TYPE_JSON]: {
                    schema: checkEntriesExistenceModel.schema,
                },
            },
        },
    },
};

checkEntriesExistenceController.manualDecodeId = true;
