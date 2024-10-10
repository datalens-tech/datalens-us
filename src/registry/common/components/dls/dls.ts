import {DLSConstructor} from './types';

export const DLS: DLSConstructor = class {
    static async checkPermission() {
        return {};
    }

    static async checkBulkPermission() {
        return [];
    }

    static async addEntity() {
        return {};
    }

    static async modifyPermissions() {
        return {};
    }
};
