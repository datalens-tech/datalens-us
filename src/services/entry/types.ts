import {RETURN_COLUMNS, RETURN_META_COLUMNS, RETURN_NAVIGATION_COLUMNS} from '../../const';
import {JoinedEntryRevisionColumns} from '../../db/presentations/joined-entry-revision';

type ColToField<T extends string> = T extends `${string} as ${infer F}`
    ? F
    : T extends `${string}.${infer F}`
      ? F
      : T;

export type EntryWithRevisionResult = Pick<
    JoinedEntryRevisionColumns,
    ColToField<(typeof RETURN_COLUMNS)[number]>
>;

// renameEntry left-joins the revisions table, so these revision-side fields can be null there
export type ReturnColumnsEntry = Omit<
    EntryWithRevisionResult,
    'revId' | 'updatedBy' | 'updatedAt'
> & {
    revId: string | null;
    updatedBy: string | null;
    updatedAt: string | null;
};

export type ReturnMetaColumnsEntry = Pick<
    JoinedEntryRevisionColumns,
    ColToField<(typeof RETURN_META_COLUMNS)[number]>
>;

export type ReturnNavigationColumnsEntry = Pick<
    JoinedEntryRevisionColumns,
    ColToField<(typeof RETURN_NAVIGATION_COLUMNS)[number]>
>;
