import {CTX} from '../types/models';

export function logInfo(ctx: CTX, message: string, extra?: Record<string, unknown>): void {
    const {tenantId, user: requestedBy, dlContext, projectId} = ctx.get('info');
    ctx.log(message, {
        ctxTenantId: tenantId,
        ctxProjectId: projectId,
        requestedBy,
        dlContext,
        ...extra,
    });
}
