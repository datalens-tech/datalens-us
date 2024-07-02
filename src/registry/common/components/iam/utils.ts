import {AppContext, AppError} from '@gravity-ui/nodekit';
import type {CheckOrganizationPermission, CheckProjectPermission} from './types';
import {OrganizationPermission, ProjectPermission} from '../../../../components/iam';
import {ZitadelUserRole} from '../../../../utils/zitadel';
import {US_ERRORS} from '../../../../const';

export const checkOrganizationPermission: CheckOrganizationPermission = async (args: {
    ctx: AppContext;
    permission: OrganizationPermission;
}) => {
    const {ctx} = args;

    if (ctx.config.zitadelUserRole === ZitadelUserRole.Viewer) {
        throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
            code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
        });
    }
};

export const checkProjectPermission: CheckProjectPermission = async (args: {
    ctx: AppContext;
    permission: ProjectPermission;
}) => {
    const {ctx} = args;

    if (ctx.config.zitadelUserRole === ZitadelUserRole.Viewer) {
        throw new AppError(US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED, {
            code: US_ERRORS.ACCESS_SERVICE_PERMISSION_DENIED,
        });
    }
};
