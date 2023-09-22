import {State} from '../../../../db/models/new/state';

export const formatGetStateResponse = (state: State) => {
    return {
        hash: state.hash,
        entryId: state.entryId,
        data: state.data,
        createdAt: state.createdAt,
    };
};
