import {AppContext, AppError} from '@gravity-ui/nodekit';
import type {CheckOrganizationPermission, CheckProjectPermission} from './types';
import {OrganizationPermission, ProjectPermission} from '../../../../components/iam';
import {US_ERRORS} from '../../../../const';
import {ZitadelUserRole} from '../../../../types/zitadel';

const throwAccessServicePermissionDenied = () => {
    throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
        code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
    });
};

export const checkOrganizationPermission: CheckOrganizationPermission = async (args: {
    ctx: AppContext;
    permission: OrganizationPermission;
}) => {
    const {ctx, permission} = args;
    const {zitadelUserRole: role} = ctx.get('info');

    switch (permission) {
        case OrganizationPermission.UseInstance:
            break;

        case OrganizationPermission.ManageInstance:
            if (role !== ZitadelUserRole.Admin) {
                throwAccessServicePermissionDenied();
            }
            break;

        case OrganizationPermission.CreateCollectionInRoot:
        case OrganizationPermission.CreateWorkbookInRoot:
            if (role !== ZitadelUserRole.Editor && role !== ZitadelUserRole.Admin) {
                throwAccessServicePermissionDenied();
            }
            break;

        default:
            throwAccessServicePermissionDenied();
    }
};

export const checkProjectPermission: CheckProjectPermission = async (args: {
    ctx: AppContext;
    permission: ProjectPermission;
}) => {
    const {ctx, permission} = args;

    const {zitadelUserRole: role} = ctx.get('info');

    switch (permission) {
        case ProjectPermission.CreateCollectionInRoot:
        case ProjectPermission.CreateWorkbookInRoot:
            if (role !== ZitadelUserRole.Editor && role !== ZitadelUserRole.Admin) {
                throwAccessServicePermissionDenied();
            }
            break;

        default:
            throwAccessServicePermissionDenied();
    }
};
