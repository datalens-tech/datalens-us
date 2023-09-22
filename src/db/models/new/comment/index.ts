import {Model} from '../../..';

export type CommentType = 'flag-x' | 'line-x' | 'band-x' | 'dot-x-y';

export class Comment extends Model {
    static get tableName() {
        return 'comments';
    }

    static get idColumn() {
        return 'id';
    }

    id!: string;
    feed!: string;
    creatorLogin!: string;
    createdDate!: string;
    modifierLogin!: Nullable<string>;
    modifiedDate!: Nullable<string>;
    date!: string;
    dateUntil!: Nullable<string>;
    type!: CommentType;
    text!: string;
    meta!: Record<string, unknown>;
    params!: Nullable<Record<string, unknown>>;
    isRemoved!: boolean;
    removedDate!: Nullable<string>;
    removerLogin!: Nullable<string>;
}
