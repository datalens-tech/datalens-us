import {PrivatePermissions} from '../types/models';

export function resolvePrivatePermissions(componentName: string): PrivatePermissions {
    switch (componentName) {
        case 'backend':
            return {ownedScopes: ['config', 'connection', 'dataset']};
        case 'ui':
            return {ownedScopes: ['dash', 'widget']};
        default:
            return {ownedScopes: []};
    }
}
