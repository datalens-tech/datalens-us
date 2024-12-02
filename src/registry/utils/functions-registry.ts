import {objectKeys} from '../../utils/utility-types';

export const createFunctionsRegistry = function <FunctionsMap extends Record<string, any>>(
    functionsMap: FunctionsMap,
) {
    const map: {[key in keyof typeof functionsMap]?: (typeof functionsMap)[key]} = {};

    const internalRegister = <T extends keyof typeof functionsMap>(id: T, fn: any): void => {
        map[id] = fn;
    };

    const registry = {
        register(registerMap: typeof map): void {
            Object.entries(registerMap).forEach(([id, fn]) => {
                internalRegister(id, fn);
            });
        },
        get() {
            return map as FunctionsMap;
        },
    };

    objectKeys(functionsMap).forEach((id) => {
        internalRegister(id, functionsMap[id]);
    });

    return registry;
};
