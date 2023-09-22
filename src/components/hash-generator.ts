'use strict';

const CRC32 = require('crc-32');

const sortObj = (value: any): any => {
    if (typeof value === 'object' && value !== null) {
        return Array.isArray(value)
            ? value.map(sortObj)
            : Object.keys(value)
                  .sort()
                  .reduce((o, key) => {
                      const v = value[key];
                      // @ts-ignore
                      o[key] = sortObj(v);
                      return o;
                  }, {});
    } else {
        return value;
    }
};

export default ({entryId, data}: {entryId: string; data: any}) => {
    const str = entryId + JSON.stringify(sortObj(data));
    let crc = CRC32.str(str);

    // convert unsigned 32-bit integer
    if (crc < 0) {
        crc += 4294967296;
    }

    crc = crc.toString(16);
    crc = ('00000000' + crc).slice(-8) + str.length;
    return crc;
};
