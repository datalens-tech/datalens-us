import {Request, Response} from '@gravity-ui/expresskit';

import {prepareResponseAsync} from '../../../components/response-presenter';
import {makeSchemaValidator} from '../../../components/validation-schema-compiler';
import {ALLOWED_SCOPE_VALUES} from '../../../const';
import {EntryScope} from '../../../db/models/new/entry/types';
import {getJoinedEntriesRevisionsByIds} from '../../../services/new/entry';

import type {GetEntriesDataResponseBody} from './types';
import {formatGetEntriesDataResponse} from './utils';

type GetEntriesDataRequestBody = {
    entryIds: string[];
    scope?: EntryScope;
    type?: string;
    fields: string[];
};

const validateBody = makeSchemaValidator({
    type: 'object',
    required: ['entryIds', 'fields'],
    properties: {
        entryIds: {
            type: 'array',
            items: {type: 'string'},
        },
        scope: {
            type: 'string',
            enum: ALLOWED_SCOPE_VALUES,
        },
        type: {
            type: 'string',
        },
        fields: {
            type: 'array',
            items: {type: 'string'},
        },
    },
});

export const getEntriesDataController = async (
    req: Request,
    res: Response<GetEntriesDataResponseBody>,
) => {
    const body = validateBody<GetEntriesDataRequestBody>(req.body);

    const result = await getJoinedEntriesRevisionsByIds(
        {ctx: req.ctx},
        {
            entryIds: body.entryIds,
            scope: body.scope,
            type: body.type,
        },
    );

    const formattedResponse = formatGetEntriesDataResponse({result, fields: body.fields});

    const {code, response} = await prepareResponseAsync({data: formattedResponse});

    res.status(code).send(response);
};
