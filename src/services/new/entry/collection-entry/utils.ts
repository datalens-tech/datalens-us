import type {AppContext} from '@gravity-ui/nodekit';

import {Entry as EntryModel} from '../../../../db/models/new/entry';
import {EntryScope} from '../../../../db/models/new/entry/types';
import {ComputeEntryPermissions} from '../../../../entities/compute-entry';
import {getComputeEntryDisabledPermissions} from '../../../../entities/compute-entry/utils';
import {Permissions as SharedEntryPermissions} from '../../../../entities/shared-entry';
import {getSharedEntryDisabledPermissions} from '../../../../entities/shared-entry/utils';
import type {CollectionEntryInstance} from '../../../../registry/plugins/common/entities/collection-entry/types';
import {ServiceArgs} from '../../types';
import type {EntryFullPermissions, EntryPermissions} from '../types';

import {mapComputeEntryPermissions, mapSharedEntryPermissions} from './permission-mappers';

export type {CollectionEntryInstance};

export const createCollectionEntry = (
    ctx: AppContext,
    model: EntryModel,
): CollectionEntryInstance => {
    const {CollectionEntry} = ctx.get('registry').common.classes.get();

    return new CollectionEntry({ctx, model});
};

export const bulkFetchCollectionEntryPermissions = async (
    {ctx}: ServiceArgs,
    items: {model: EntryModel; parentIds: string[]}[],
): Promise<Map<string, CollectionEntryInstance>> => {
    const {CollectionEntry} = ctx.get('registry').common.classes.get();

    const instances = await CollectionEntry.bulkFetchAllPermissions(ctx, items);

    const map = new Map<string, CollectionEntryInstance>();

    instances.forEach((instance) => {
        map.set(instance.model.entryId, instance);
    });

    return map;
};

export const getCollectionEntryPermissions = (
    entry: CollectionEntryInstance,
): EntryPermissions | undefined =>
    entry.model.scope === EntryScope.Compute
        ? mapComputeEntryPermissions(entry.permissions as ComputeEntryPermissions | undefined)
        : mapSharedEntryPermissions(entry.permissions as SharedEntryPermissions | undefined);

export const getCollectionEntryDisabledPermissions = (scope: EntryScope): EntryFullPermissions =>
    scope === EntryScope.Compute
        ? getComputeEntryDisabledPermissions()
        : getSharedEntryDisabledPermissions();
