import {EntryScope} from '../../../db/models/new/entry/types';

import {ACCESS_DENIED_ERROR_CODE, NOT_FOUND_ERROR_CODE} from './constants';

export type GetEntriesDataResponseItemResult = {
    scope: Nullable<EntryScope>;
    type: string;
    data: Record<string, unknown>;
};

export type GetEntriesDataResponseItem = {
    entryId: string;
} & (
    | {
          result: GetEntriesDataResponseItemResult;
      }
    | {
          error: {
              code: typeof NOT_FOUND_ERROR_CODE | typeof ACCESS_DENIED_ERROR_CODE;
          };
      }
);

export type GetEntriesDataResponseBody = GetEntriesDataResponseItem[];
