import {AppError, AppContext} from '@gravity-ui/nodekit';
import {ServiceArgs} from '../types';
import {US_ERRORS} from '../../../const';
import {OrganizationPermission, ProjectPermission} from '../../../components/iam';
import {registry} from '../../../registry';
import {Feature, isEnabledFeature} from '../../../components/features';

export const getRootCollectionPermissions = async ({ctx}: ServiceArgs) => {
    ctx.log('GET_ROOT_COLLECTION_PERMISSIONS_START');

    const {accessServiceEnabled} = ctx.config;

    const result = {
        createCollectionInRoot: true,
        createWorkbookInRoot: true,
    };

    if (accessServiceEnabled) {
        const [createCollectionInRoot, createWorkbookInRoot] = await Promise.all([
            checkCreateCollectionInRoot(ctx),
            checkCreateWorkbookInRoot(ctx),
        ]);

        result.createCollectionInRoot = createCollectionInRoot;
        result.createWorkbookInRoot = createWorkbookInRoot;
    }

    ctx.log('GET_ROOT_COLLECTION_PERMISSIONS_FINISH');

    return result;
};

async function checkCreateCollectionInRoot(ctx: AppContext) {
    const {checkOrganizationPermission, checkProjectPermission} = registry.common.functions.get();
    try {
        if (isEnabledFeature(ctx, Feature.ProjectsEnabled)) {
            await checkProjectPermission({
                ctx,
                permission: ProjectPermission.CreateCollectionInRoot,
            });
        } else {
            await checkOrganizationPermission({
                ctx,
                permission: OrganizationPermission.CreateCollectionInRoot,
            });
        }
        return true;
    } catch (error: unknown) {
        const err = error as AppError;
        if (err.code === US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED) {
            return false;
        } else {
            throw error;
        }
    }
}

async function checkCreateWorkbookInRoot(ctx: AppContext) {
    const {checkOrganizationPermission, checkProjectPermission} = registry.common.functions.get();
    try {
        if (isEnabledFeature(ctx, Feature.ProjectsEnabled)) {
            await checkProjectPermission({
                ctx,
                permission: ProjectPermission.CreateWorkbookInRoot,
            });
        } else {
            await checkOrganizationPermission({
                ctx,
                permission: OrganizationPermission.CreateWorkbookInRoot,
            });
        }
        return true;
    } catch (error: unknown) {
        const err = error as AppError;
        if (err.code === US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED) {
            return false;
        } else {
            throw error;
        }
    }
}
