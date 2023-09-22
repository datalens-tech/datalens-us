import {createClassesRegistry} from '../utils/classes-registry';
import {createFunctionsRegistry} from '../utils/functions-registry';

import {commonClassesMap} from './classes-map';
import {commonFunctionsMap} from './functions-map';

const classesRegistry = createClassesRegistry(commonClassesMap);
const functionsRegistry = createFunctionsRegistry(commonFunctionsMap);

export const commonRegistry = {
    classes: classesRegistry,
    functions: functionsRegistry,
};
