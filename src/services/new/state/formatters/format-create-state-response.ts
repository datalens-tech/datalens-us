import {State} from '../../../../db/models/new/state';

export const formatCreateStateResponse = (state: State) => {
    return {
        hash: state.hash,
    };
};
