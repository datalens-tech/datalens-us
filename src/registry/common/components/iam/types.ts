import type {AppContext} from '@gravity-ui/nodekit';
import type {OrganizationPermission, ProjectPermission} from '../../../../components/iam';

export type CheckOrganizationPermission = (args: {
    ctx: AppContext;
    permission: OrganizationPermission;
}) => Promise<void>;

export type CheckProjectPermission = (args: {
    ctx: AppContext;
    permission: ProjectPermission;
}) => Promise<void>;
