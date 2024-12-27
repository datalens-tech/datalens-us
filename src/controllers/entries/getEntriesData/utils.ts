import _ from 'lodash';

import type {GetJoinedEntriesRevisionsByIdsResult} from '../../../services/new/entry';

import {ACCESS_DENIED_ERROR_CODE, NOT_FOUND_ERROR_CODE} from './constants';
import type {GetEntriesDataResponseBody, GetEntriesDataResponseItemResult} from './types';

export const formatGetEntriesDataResponse = ({
    result,
    fields,
}: {
    result: GetJoinedEntriesRevisionsByIdsResult;
    fields: string[];
}): GetEntriesDataResponseBody => {
    const {entries, notFoundEntryIds, accessDeniedEntryIds} = result;

    const formattedResult: GetEntriesDataResponseBody = [];

    entries.forEach(({entryId, scope, type, data}) => {
        let responseData: GetEntriesDataResponseItemResult['data'];

        if (data) {
            responseData = fields.reduce<GetEntriesDataResponseItemResult['data']>(
                (acc, fieldPath) => {
                    acc[fieldPath] = _.get(data, fieldPath);

                    return acc;
                },
                {},
            );
        } else {
            responseData = {};
        }

        formattedResult.push({
            entryId,
            result: {
                scope,
                type,
                data: responseData,
            },
        });
    });

    notFoundEntryIds.forEach((entryId) => {
        formattedResult.push({entryId, error: {code: NOT_FOUND_ERROR_CODE}});
    });

    accessDeniedEntryIds.forEach((entryId) => {
        formattedResult.push({entryId, error: {code: ACCESS_DENIED_ERROR_CODE}});
    });

    return formattedResult;
};
