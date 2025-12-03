import {ActivitiesDeps} from '../../types';

export function callActivity<T>({
    activityFn,
    deps,
}: {
    activityFn: (deps: ActivitiesDeps) => Promise<T>;
    deps: ActivitiesDeps;
}): Promise<T>;

export function callActivity<T, A>({
    activityFn,
    deps,
    args,
}: {
    activityFn: (deps: ActivitiesDeps, args: A) => Promise<T>;
    deps: ActivitiesDeps;
    args: A;
}): Promise<T>;

export function callActivity<T, A>({
    activityFn,
    deps,
    args,
}: {
    activityFn: (deps: ActivitiesDeps, args?: A) => Promise<T>;
    deps: ActivitiesDeps;
    args?: A;
}): Promise<T> {
    return deps.ctx.call(
        `Activity ${activityFn.name}`,
        (ctx) => {
            return activityFn(
                {
                    ...deps,
                    ctx,
                },
                args,
            );
        },
        (args as {requestId?: string} | undefined)?.requestId
            ? {
                  loggerPostfix: `[${(args as {requestId?: string}).requestId}]`,
              }
            : undefined,
    );
}
