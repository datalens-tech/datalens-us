'use strict';

/*
    Use:
    node scripts/helpers.js --helper=decode -- r41ri22abtygq r41ri22abtygq
 */

const {default: Utils} = require('../dist/server/utils/index.js');
const fs = require('fs');
const util = require('util');

util.inspect.defaultOptions.maxArrayLength = null;

const args = require('minimist')(process.argv.slice(2), {
    alias: {
        h: 'helper',
    },
    string: ['_'],
});

const {helper} = args;

switch (helper) {
    case 'decode': {
        const encodedIds = args._;
        const decodedIds = encodedIds.map(Utils.decodeId);

        console.log(decodedIds);
        break;
    }
    case 'encode': {
        const encodedIds = args._;
        const decodedIds = encodedIds.map(Utils.encodeId);

        console.log(decodedIds);
        break;
    }
    case 'encodes': {
        const ids = [
            // INSERT BIGINT IDS HERE
        ];
        const encodedIdsMap = ids.reduce((encodedIdsMap, id) => {
            encodedIdsMap[id] = Utils.encodeId(id);

            return encodedIdsMap;
        }, {});

        const writeCsvStream = fs.createWriteStream('scripts/encodes.csv');

        writeCsvStream.once('open', () => {
            const encodedIds = Object.entries(encodedIdsMap);

            encodedIds.map(([id, encodedId], index) => {
                let csvLine = `${id},${encodedId}`;

                if (index < encodedIds.length - 1) {
                    csvLine += '\n';
                }

                writeCsvStream.write(csvLine);
            });
            writeCsvStream.end();
        });

        console.log(encodedIdsMap);
        break;
    }
    default: {
        console.log('not exist helper');
    }
}
