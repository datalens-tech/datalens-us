import type {ActivitiesDeps} from '../../../types';
import {callActivity} from '../../utils/call-activity';

import {GreetArgs, greet} from './greet';

export const createActivities = (deps: ActivitiesDeps) => ({
    async greet(args: GreetArgs) {
        return callActivity({
            activityFn: greet,
            deps,
            args,
        });
    },
});
