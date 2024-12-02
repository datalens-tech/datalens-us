import {objectKeys} from '../../utils/utility-types';

export const createClassesRegistry = function <ClassesMap extends Record<string, any>>(
    classesMap: ClassesMap,
) {
    const map: {[key in keyof typeof classesMap]?: (typeof classesMap)[key]} = {};

    const internalRegister = <T extends keyof typeof classesMap>(id: T, clss: any): void => {
        map[id] = clss;
    };

    const registry = {
        register(registerMap: typeof map): void {
            Object.entries(registerMap).forEach(([id, clss]) => {
                internalRegister(id, clss);
            });
        },
        get() {
            return map as ClassesMap;
        },
    };

    objectKeys(classesMap).forEach((id) => {
        internalRegister(id, classesMap[id]);
    });

    return registry;
};
