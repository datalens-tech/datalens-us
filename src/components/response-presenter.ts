import * as ST from '../types/services.types';
import Utils from '../utils';

/** @deprecated use prepareResponseAsync */
export default ({data}: {data: any}): ST.ServiceResponse => {
    const response = Utils.encodeData(data);

    if (response.results) {
        response.results = Utils.encodeData(response.results);
    }
    if (response.entries) {
        response.entries = Utils.encodeData(response.entries);
    }
    if (response.workbooks) {
        response.workbooks = Utils.encodeData(response.workbooks);
    }
    if (response.collections) {
        response.collections = Utils.encodeData(response.collections);
    }
    if (response.embed) {
        response.embed = Utils.encodeData(response.embed);
    }
    if (response.chart) {
        response.chart = Utils.encodeData(response.chart);
    }

    return {
        code: 200,
        response,
    };
};

export async function prepareResponseAsync({data}: {data: any}): Promise<ST.ServiceResponse> {
    const response = await Utils.macrotasksEncodeData(data);

    if (response.results) {
        response.results = await Utils.macrotasksEncodeData(response.results);
    }
    if (response.entries) {
        response.entries = await Utils.macrotasksEncodeData(response.entries);
    }
    if (response.workbooks) {
        response.workbooks = await Utils.macrotasksEncodeData(response.workbooks);
    }
    if (response.collections) {
        response.collections = await Utils.macrotasksEncodeData(response.collections);
    }
    if (response.embed) {
        response.embed = await Utils.macrotasksEncodeData(response.embed);
    }
    if (response.chart) {
        response.chart = await Utils.macrotasksEncodeData(response.chart);
    }

    return {
        code: 200,
        response,
    };
}
