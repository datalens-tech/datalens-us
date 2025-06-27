import {extendController} from './extend';
import {lockController} from './lock';
import {unlockController} from './unlock';
import {verifyExistenceController} from './verify-existence';

export default {
    verifyExistence: verifyExistenceController,
    lock: lockController,
    unlock: unlockController,
    extend: extendController,
};
