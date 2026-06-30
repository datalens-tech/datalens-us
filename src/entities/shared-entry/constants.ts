import {EntryScope} from '../../db/models/new/entry/types';

export const ALLOWED_SHARED_ENTRY_SCOPES = [EntryScope.Connection, EntryScope.Dataset];

export const ALLOWED_COLLECTION_ENTRY_SCOPES = [...ALLOWED_SHARED_ENTRY_SCOPES, EntryScope.Compute];
