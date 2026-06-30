import {AuthPolicy} from '@gravity-ui/expresskit';
import {AppContext} from '@gravity-ui/nodekit';

import {UserRole} from '../../../../../components/auth/constants/role';
import {AccessServicePermissionDeniedError} from '../../../../../components/errors';
import {OrganizationPermission} from '../../../../../components/iam';

import type {CheckOrganizationPermission} from './types';

export const throwAccessServicePermissionDenied = () => {
    throw new AccessServicePermissionDeniedError();
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

export const checkOrganizationPermission: CheckOrganizationPermission = async (args: {
    ctx: AppContext;
    permission: OrganizationPermission;
}) => {
    if (args.ctx.config.appAuthPolicy !== AuthPolicy.disabled) {
        await checkAuthOrganizationPermission(args);
    }
};
