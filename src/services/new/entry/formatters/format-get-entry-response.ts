import {GetEntryResult} from '../../../../services/new/entry/get-entry';
import {CTX} from '../../../../types/models';

export const formatGetEntryResponse = async (ctx: CTX, result: GetEntryResult) => {
    const {
        joinedEntryRevisionFavoriteTenant,
        permissions,
        includePermissionsInfo,
        includeLinks,
        servicePlan,
        includeServicePlan,
        includeTenantFeatures,
        tenantFeatures,
    } = result;

    const {privatePermissions, onlyPublic} = ctx.get('info');
    const registry = ctx.get('registry');

    let isHiddenUnversionedData = false;
    if (!privatePermissions.ownedScopes.includes(joinedEntryRevisionFavoriteTenant?.scope!)) {
        isHiddenUnversionedData = true;
    }

    let isHiddenIsFavorite = false;
    if (onlyPublic) {
        isHiddenIsFavorite = true;
    }

    const {getEntryAddFormattedFieldsHook} = registry.common.functions.get();

    const additionalFields = getEntryAddFormattedFieldsHook({ctx});

    return {
        entryId: joinedEntryRevisionFavoriteTenant.entryId,
        scope: joinedEntryRevisionFavoriteTenant.scope,
        type: joinedEntryRevisionFavoriteTenant.type,
        key: joinedEntryRevisionFavoriteTenant.displayKey,
        unversionedData: isHiddenUnversionedData
            ? undefined
            : joinedEntryRevisionFavoriteTenant.unversionedData,
        createdBy: joinedEntryRevisionFavoriteTenant.createdBy,
        createdAt: joinedEntryRevisionFavoriteTenant.createdAt,
        updatedBy: joinedEntryRevisionFavoriteTenant.updatedBy,
        updatedAt: joinedEntryRevisionFavoriteTenant.updatedAt,
        savedId: joinedEntryRevisionFavoriteTenant.savedId,
        publishedId: joinedEntryRevisionFavoriteTenant.publishedId,
        revId: joinedEntryRevisionFavoriteTenant.revId,
        tenantId: joinedEntryRevisionFavoriteTenant.tenantId,
        data: joinedEntryRevisionFavoriteTenant.data,
        meta: joinedEntryRevisionFavoriteTenant.meta,
        hidden: joinedEntryRevisionFavoriteTenant.hidden,
        public: joinedEntryRevisionFavoriteTenant.public,
        workbookId: joinedEntryRevisionFavoriteTenant.workbookId,
        links: includeLinks ? joinedEntryRevisionFavoriteTenant.links : undefined,
        isFavorite: isHiddenIsFavorite ? undefined : joinedEntryRevisionFavoriteTenant.isFavorite,
        permissions: includePermissionsInfo ? permissions : undefined,
        servicePlan: includeServicePlan ? servicePlan : undefined,
        tenantFeatures: includeTenantFeatures ? tenantFeatures : undefined,
        ...additionalFields,
    };
};
