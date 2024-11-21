import {CTX} from '../../../../types/models';
import {GetEntryResult} from '../../../../services/new/entry/get-entry';

export const formatGetEntryResponse = async (ctx: CTX, result: GetEntryResult) => {
    const {joinedEntryRevisionFavorite, permissions, includePermissionsInfo, includeLinks} = result;

    const {privatePermissions, onlyPublic} = ctx.get('info');
    const registry = ctx.get('registry');

    let isHiddenUnversionedData = false;
    if (!privatePermissions.ownedScopes.includes(joinedEntryRevisionFavorite?.scope!)) {
        isHiddenUnversionedData = true;
    }

    let isHiddenIsFavorite = false;
    if (onlyPublic) {
        isHiddenIsFavorite = true;
    }

    const {getEntryAddFormattedFieldsHook} = registry.common.functions.get();

    const additionalFields = await getEntryAddFormattedFieldsHook({ctx, result});

    return {
        entryId: joinedEntryRevisionFavorite.entryId,
        scope: joinedEntryRevisionFavorite.scope,
        type: joinedEntryRevisionFavorite.type,
        key: joinedEntryRevisionFavorite.displayKey,
        unversionedData: isHiddenUnversionedData
            ? undefined
            : joinedEntryRevisionFavorite.unversionedData,
        createdBy: joinedEntryRevisionFavorite.createdBy,
        createdAt: joinedEntryRevisionFavorite.createdAt,
        updatedBy: joinedEntryRevisionFavorite.updatedBy,
        updatedAt: joinedEntryRevisionFavorite.updatedAt,
        savedId: joinedEntryRevisionFavorite.savedId,
        publishedId: joinedEntryRevisionFavorite.publishedId,
        revId: joinedEntryRevisionFavorite.revId,
        tenantId: joinedEntryRevisionFavorite.tenantId,
        data: joinedEntryRevisionFavorite.data,
        meta: joinedEntryRevisionFavorite.meta,
        hidden: joinedEntryRevisionFavorite.hidden,
        public: joinedEntryRevisionFavorite.public,
        workbookId: joinedEntryRevisionFavorite.workbookId,
        links: includeLinks ? joinedEntryRevisionFavorite.links : undefined,
        isFavorite: isHiddenIsFavorite ? undefined : joinedEntryRevisionFavorite.isFavorite,
        permissions: includePermissionsInfo ? permissions : undefined,
        ...additionalFields,
    };
};
