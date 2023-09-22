import {DLSConstructor} from './types';

export const DLS: DLSConstructor = class {
    static fillPredefinedPermissions() {
        return [] as [] | {[key: string]: object[]};
    }

    static async checkIamManagePermission() {
        return true;
    }

    static async checkEntriesInTenant() {
        return;
    }

    static prepareHeaders() {
        return {};
    }

    static async checkPermission() {
        return {};
    }

    static async checkBulkPermission() {
        return [];
    }

    static async addEntity() {
        return {};
    }

    static async getPermissions() {
        return {};
    }

    static async modifyPermissions() {
        return {};
    }

    static async batchPermissions() {
        return [];
    }

    static async suggest() {
        return [];
    }
};
