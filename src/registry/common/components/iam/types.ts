import type {AppContext} from '@gravity-ui/nodekit';

import type {OrganizationPermission} from '../../../../components/iam';

export type CheckOrganizationPermission = (args: {
    ctx: AppContext;
    permission: OrganizationPermission;
}) => Promise<void>;
