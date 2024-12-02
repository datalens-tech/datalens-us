import repl = require('repl');

import {raw, transaction} from 'objection';

import {Model, db, getId} from './db';
import Entry from './db/models/entry';
import Tenant from './db/models/tenant';
import Utils from './utils';

async function runConsole(): Promise<void> {
    process.env.REPL_MODE = '1';

    const replServer = repl.start();

    replServer.context.r = (p: Promise<unknown>) => {
        p.then((result) => console.log('\n\n', result, '\n\nPress enter to continue')).catch(
            console.error,
        );
    };
    replServer.context.s = (p: Promise<unknown>) => {
        p.then(() => console.log('\n\nDone', '\n\nPress enter to continue')).catch(console.error);
    };

    replServer.context.db = db;
    replServer.context.raw = raw;
    replServer.context.transaction = transaction;

    replServer.context.getId = getId;
    replServer.context.encodeId = Utils.encodeId;
    replServer.context.decodeId = Utils.decodeId;

    replServer.context.Model = Model;
    replServer.context.Tenant = Tenant;
    replServer.context.Entry = Entry;

    db.ready().then(() => {
        const {user, host, port, database} = db.primary.client.connectionSettings;
        console.log(`\nLogged in as ${user} to database ${database} on host ${host}:${port}`);
        console.log('Press enter to start');
    });
}

runConsole().catch(console.error);
