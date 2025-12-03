import type {ActivitiesDeps} from '../types';

import {createActivities as createExampleActivities} from './example/activities';

export const createActivities = (deps: ActivitiesDeps) => ({
    ...createExampleActivities(deps),
});
