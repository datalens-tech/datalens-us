import {PrivatePermissions} from '../types/models';

export function resolvePrivatePermissions(componentName: string): PrivatePermissions {
    switch (componentName) {
        case 'backend':
            return {ownedScopes: ['config', 'connection', 'dataset']};
        case 'ui':
            return {ownedScopes: ['dash', 'widget', 'report']};
        default:
            return {ownedScopes: []};
    }
}

export function filterUnversionedData<T>(
    scope: string | null | undefined,
    unversionedData: T,
    privatePermissions: PrivatePermissions,
): T | undefined {
    const ownedScopes: readonly string[] = privatePermissions.ownedScopes;
    return scope && ownedScopes.includes(scope) ? unversionedData : undefined;
}
