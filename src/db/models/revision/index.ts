import {Model} from 'objection';

import {RevisionColumns} from '../../../types/models';

interface Revision extends RevisionColumns {}
class Revision extends Model {
    static get tableName() {
        return 'revisions';
    }

    static get idColumn() {
        return 'rev_id';
    }
}

export default Revision;
