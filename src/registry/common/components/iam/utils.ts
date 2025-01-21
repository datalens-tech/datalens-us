import {AppContext, AppError} from '@gravity-ui/nodekit';

import {UserRole} from '../../../../components/auth/constants/role';
import {OrganizationPermission} from '../../../../components/iam';
import {US_ERRORS} from '../../../../const';
import {ZitadelUserRole} from '../../../../types/zitadel';

import type {CheckOrganizationPermission} from './types';

const throwAccessServicePermissionDenied = () => {
    throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
        code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
    });
};

const checkAuthOrganizationPermission: CheckOrganizationPermission = async (args: {
    ctx: AppContext;
    permission: OrganizationPermission;
}) => {
    const {ctx, permission} = args;
    const roles = ctx.get('user')?.roles || [];

    switch (permission) {
        case OrganizationPermission.UseInstance:
            break;

        case OrganizationPermission.ManageInstance: {
            if (roles.every((role) => role !== UserRole.Admin)) {
                throwAccessServicePermissionDenied();
            }
            break;
        }

        case OrganizationPermission.CreateCollectionInRoot:
        case OrganizationPermission.CreateWorkbookInRoot: {
            if (roles.every((role) => role !== UserRole.Editor && role !== UserRole.Admin)) {
                throwAccessServicePermissionDenied();
            }
            break;
        }

        default:
            throwAccessServicePermissionDenied();
    }
};

const checkZitadelOrganizationPermission: CheckOrganizationPermission = async (args: {
    ctx: AppContext;
    permission: OrganizationPermission;
}) => {
    const {ctx, permission} = args;
    const {zitadelUserRole} = ctx.get('info');

    switch (permission) {
        case OrganizationPermission.UseInstance:
            break;

        case OrganizationPermission.ManageInstance: {
            if (zitadelUserRole !== ZitadelUserRole.Admin) {
                throwAccessServicePermissionDenied();
            }
            break;
        }

        case OrganizationPermission.CreateCollectionInRoot:
        case OrganizationPermission.CreateWorkbookInRoot: {
            if (
                zitadelUserRole !== ZitadelUserRole.Editor &&
                zitadelUserRole !== ZitadelUserRole.Admin
            ) {
                throwAccessServicePermissionDenied();
            }
            break;
        }

        default:
            throwAccessServicePermissionDenied();
    }
};

export const checkOrganizationPermission: CheckOrganizationPermission = async (args: {
    ctx: AppContext;
    permission: OrganizationPermission;
}) => {
    if (args.ctx.config.isAuthEnabled) {
        await checkAuthOrganizationPermission(args);
    } else {
        await checkZitadelOrganizationPermission(args);
    }
};
