import {AppError} from '@gravity-ui/nodekit';

import {Model} from '../..';
import {US_ERRORS} from '../../../const';
import * as MT from '../../../types/models';

import {validateGet} from './scheme';

interface Tenant extends MT.TenantColumns {}
class Tenant extends Model {
    static get tableName() {
        return 'tenants';
    }

    static get idColumn() {
        return 'tenant_id';
    }

    static async get(tenantId: string, ctx: MT.CTX) {
        ctx.log('TENANT_GET_ONE', {tenantId});

        const {isValid, validationErrors} = validateGet({tenantId});

        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }

        const result = await Tenant.query(this.replica)
            .select()
            .where({tenantId})
            .returning('*')
            .first()
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        if (!result) {
            throw new AppError(US_ERRORS.NOT_EXIST_TENANT, {
                code: US_ERRORS.NOT_EXIST_TENANT,
            });
        }

        ctx.log('TENANT_GET_ONE_SUCCESS');

        return result;
    }

    static async checkExistence(tenantId: string, ctx: MT.CTX) {
        ctx.log('CHECK_TENANT_EXISTENCE', {tenantId});

        const {isValid, validationErrors} = validateGet({tenantId});

        try {
            if (!isValid) {
                throw new AppError('Validation error', {
                    code: US_ERRORS.VALIDATION_ERROR,
                    details: {validationErrors},
                });
            }

            const result = await Tenant.query(this.replica)
                .select()
                .where({tenantId, enabled: true})
                .returning('*')
                .first()
                .timeout(Model.DEFAULT_QUERY_TIMEOUT);

            ctx.log('CHECK_TENANT_EXISTENCE_SUCCESS');

            return Boolean(result);
        } catch (error) {
            ctx.logError('CHECK_TENANT_EXISTENCE_FAILED', error);

            throw new AppError('CHECK_TENANT_EXISTENCE_FAILED', {
                code: 'CHECK_TENANT_EXISTENCE_FAILED',
            });
        }
    }

    static async markAsDeleting(tenantId: string, ctx: MT.CTX) {
        ctx.log('Marking tenant as deleting', {tenantId});

        const tenant = await Tenant.query(this.primary)
            .where({tenantId})
            .first()
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        if (!tenant) {
            throw new AppError(US_ERRORS.NOT_EXIST_TENANT, {
                code: US_ERRORS.NOT_EXIST_TENANT,
            });
        }

        await Tenant.query(this.primary)
            .where({tenantId})
            .update({
                deleting: true,
                enabled: false,
                meta: {
                    ...tenant.meta,
                    deleteContext: {
                        startAt: new Date().toISOString(),
                        requestId: ctx.get('requestId') ?? '',
                        traceId: ctx.getTraceId() ?? '',
                    },
                },
            })
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        ctx.log('Tenant marked as deleting', {tenantId});
        return {tenantId};
    }

    static async delete(tenantId: string, ctx: MT.CTX) {
        ctx.log('Deleting tenant', {tenantId});

        await Tenant.query(this.primary)
            .where({tenantId})
            .delete()
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        ctx.log('Tenant deleted', {tenantId});

        return {tenantId};
    }
}

export default Tenant;
