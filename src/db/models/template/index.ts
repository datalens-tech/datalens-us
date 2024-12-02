import {AppError} from '@gravity-ui/nodekit';

import {Model} from '../..';
import {US_ERRORS} from '../../../const';
import * as MT from '../../../types/models';

import {validateCreate, validateDelete, validateGet, validateUpdate} from './scheme';

interface Template extends MT.TemplateColumns {}
class Template extends Model {
    static get tableName() {
        return 'templates';
    }

    static get idColumn() {
        return 'name';
    }

    static async getAll({ctx}: MT.GetAllTemplate) {
        ctx.log('TEMPLATE_GET_ALL');

        const templates = await Template.query(this.replica)
            .select()
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        ctx.log('TEMPLATE_GET_ALL_SUCCESS');

        return templates;
    }

    static async get({ctx, name}: MT.GetTemplate) {
        ctx.log('TEMPLATE_GET', {name});

        const {isValid, validationErrors} = validateGet({name});

        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }

        const template = await Template.query(this.replica)
            .select()
            .where({name})
            .first()
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        if (!template) {
            throw new AppError('TEMPLATE_NOT_EXISTS', {
                code: 'TEMPLATE_NOT_EXISTS',
            });
        }

        ctx.log('TEMPLATE_GET_SUCCESS');

        return template;
    }

    static async create({name, data, ctx}: MT.CreateTemplate) {
        ctx.log('TEMPLATE_CREATE', {
            name,
            data,
        });

        const {isValid, validationErrors} = validateCreate({name, data});

        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }

        const template = await Template.query(this.primary)
            .insert({
                name,
                data,
            })
            .returning('*')
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        ctx.log('TEMPLATE_CREATE_SUCCESS');

        return template;
    }

    static async update({name, data, ctx}: MT.UpdateTemplate) {
        ctx.log('TEMPLATE_UPDATE', {name, data});

        const {isValid, validationErrors} = validateUpdate({name, data});

        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }

        const template = await Template.query(this.primary)
            .update({
                data,
            })
            .where({
                name,
            })
            .returning('*')
            .first()
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        if (!template) {
            throw new AppError('TEMPLATE_NOT_EXISTS', {
                code: 'TEMPLATE_NOT_EXISTS',
            });
        }

        ctx.log('TEMPLATE_UPDATE_SUCCESS');

        return template;
    }

    static async delete({name, ctx}: MT.DeleteTemplate) {
        ctx.log('TEMPLATE_DELETE', {name});

        const {isValid, validationErrors} = validateDelete({name});

        if (!isValid) {
            throw new AppError('Validation error', {
                code: US_ERRORS.VALIDATION_ERROR,
                details: {validationErrors},
            });
        }

        const template = await Template.query(this.primary)
            .deleteById(name)
            .returning('*')
            .first()
            .timeout(Model.DEFAULT_QUERY_TIMEOUT);

        if (!template) {
            throw new AppError('TEMPLATE_NOT_EXISTS', {
                code: 'TEMPLATE_NOT_EXISTS',
            });
        }

        ctx.log('TEMPLATE_DELETE_SUCCESS');

        return template;
    }
}

export default Template;
