import {CollectionModel} from '../../../../db/models/new/collection';
import {Entry} from '../../../../db/models/new/entry';
import {Favorite} from '../../../../db/models/new/favorite';
import {RevisionModel} from '../../../../db/models/new/revision';
import {Tenant} from '../../../../db/models/new/tenant';
import {WorkbookModel} from '../../../../db/models/new/workbook';

import {
    collectionColumns,
    entryColumns,
    favoriteColumns,
    revisionColumns,
    tenantColumns,
} from './constants';

type SelectedFavorite = Pick<Favorite, ArrayElement<typeof favoriteColumns>>;

export type SelectedRevision = Pick<RevisionModel, ArrayElement<typeof revisionColumns>>;

type SelectedTenant = Pick<Tenant, ArrayElement<typeof tenantColumns>>;

type SelectedCollection = Pick<CollectionModel, ArrayElement<typeof collectionColumns>>;

export type SelectedEntry = Pick<Entry, ArrayElement<typeof entryColumns>> & {
    revisions?: SelectedRevision[];
    savedRevision?: SelectedRevision;
    publishedRevision?: SelectedRevision;
    workbook?: WorkbookModel;
    collection?: SelectedCollection;
    favorite?: SelectedFavorite;
    tenant?: SelectedTenant;
};
