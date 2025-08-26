import {Entry} from '../../../../db/models/new/entry';
import {Favorite} from '../../../../db/models/new/favorite';
import {RevisionModel} from '../../../../db/models/new/revision';
import {Tenant} from '../../../../db/models/new/tenant';
import {WorkbookModel} from '../../../../db/models/new/workbook';

import {entryColumns, favoriteColumns, revisionColumns, tenantColumns} from './constants';

type SelectedFavorite = Pick<Favorite, ArrayElement<typeof favoriteColumns>>;

export type SelectedRevision = Pick<RevisionModel, ArrayElement<typeof revisionColumns>>;

type SelectedTenant = Pick<Tenant, ArrayElement<typeof tenantColumns>>;

export type SelectedEntry = Pick<Entry, ArrayElement<typeof entryColumns>> & {
    revisions?: SelectedRevision[];
    savedRevision?: SelectedRevision;
    publishedRevision?: SelectedRevision;
    workbook?: WorkbookModel;
    favorite?: SelectedFavorite;
    tenant?: SelectedTenant;
};
