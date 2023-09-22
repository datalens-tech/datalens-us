'use strict';

import compileSchema from '../../../components/validation-schema-compiler';
import {AJV_PATTERN_KEYS_NOT_OBJECT} from '../../../const';

const validateCreateLink = compileSchema({
    type: 'object',
    required: ['entryId', 'links'],
    properties: {
        entryId: {
            type: 'string',
        },
        links: {
            type: ['object'],
            patternProperties: AJV_PATTERN_KEYS_NOT_OBJECT,
        },
    },
});

export {validateCreateLink};
