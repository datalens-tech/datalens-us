import {ZitadelUserRole} from '../../types/zitadel';
import {GetZitadelUserRole} from './types';

export const getZitadelUserRole: GetZitadelUserRole = (data: any): ZitadelUserRole => {
    const scope = 'urn:zitadel:iam:org:project:roles';

    const roles = data[scope];

    if (!roles) {
        return ZitadelUserRole.Viewer;
    }

    if (roles[ZitadelUserRole.Admin]) {
        return ZitadelUserRole.Admin;
    }

    if (roles[ZitadelUserRole.Editor]) {
        return ZitadelUserRole.Editor;
    }

    return ZitadelUserRole.Viewer;
};
