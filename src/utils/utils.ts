import {AppError} from '@gravity-ui/nodekit';
import chunk from 'lodash/chunk';

import {
    CODING_BASE,
    COPY_END,
    COPY_START,
    ENCODED_ID_LENGTH,
    ID_VARIABLES,
    TRUE_FLAGS,
    US_ERRORS,
} from '../const';
import {EntryScope as EntryScopeEnum, EntryType} from '../db/models/new/entry/types';
import {EntryScope, USAPIResponse} from '../types/models';

const fs = require('fs');

const PowerRadix = require('power-radix');

const MAX_PAGE_LIMIT = 10000;

const PROFILES: {
    [key: string]: any;
} = {};

export class Utils {
    static get idVariables() {
        return ID_VARIABLES;
    }

    static get base() {
        return CODING_BASE;
    }

    static isExist(properties: any[]) {
        return [...properties].some((property) => property || property === null || property === '');
    }

    static wrapValuesInArray(obj: {[key: string]: any}): object {
        return Object.keys(obj).reduce((normalized: {[key: string]: any}, key) => {
            normalized[key] = Array.isArray(obj[key]) ? obj[key] : [obj[key]];
            return normalized;
        }, {});
    }

    static formatKey(key: string, isFolder: boolean) {
        let keyFormatted = key;

        if (isFolder) {
            if (key.slice(-1) !== '/') {
                keyFormatted += '/';
            }
        } else if (key !== '/') {
            if (key.slice(-1) === '/') {
                keyFormatted = keyFormatted.slice(0, -1);
            }
        }

        return keyFormatted;
    }

    static getFoldersKeys({folderKey}: {folderKey: string}) {
        return folderKey
            .split('/')
            .filter((level) => level)
            .reduce((folderKeys: any[], _level, index, keys) => {
                const folderKey = keys.slice(0, index + 1).join('/');
                const formattedFolderKey: string = this.formatKey(folderKey, true);

                folderKeys.push(formattedFolderKey);

                return folderKeys;
            }, []);
    }

    static getParentFolderKey({keyFormatted = ''}) {
        const slashIndex = keyFormatted.lastIndexOf('/', keyFormatted.length - 2);
        const parentFolderKey = keyFormatted.slice(0, slashIndex + 1);

        return parentFolderKey ? parentFolderKey : '/';
    }

    static getFullParentFolderKeys(keyFormatted = '') {
        let parentFolderKey = keyFormatted;

        const parentFolderKeys = [];

        while (parentFolderKey.length) {
            const newParentFolderKey = Utils.getParentFolderKey({
                keyFormatted: parentFolderKey,
            });

            if (newParentFolderKey) {
                parentFolderKey = newParentFolderKey;

                parentFolderKeys.push(newParentFolderKey);

                if (newParentFolderKey.split('/').length <= 2) {
                    break;
                }
            } else {
                break;
            }
        }

        return parentFolderKeys;
    }

    static isRoot(key: string | undefined) {
        return key === '/';
    }

    static isFolder({scope}: {scope: EntryScope}) {
        return scope === 'folder';
    }

    static isUsersFolder(key: string) {
        return key.toLowerCase() === 'users/';
    }

    static getNameByKey({key}: {key: Nullable<string>}) {
        if (key === null) {
            throw new Error('Cannot extract name');
        }

        const match = key.match(/([^/]+)\/?$/);

        if (match) {
            return match[1];
        } else {
            throw new Error('Cannot extract name');
        }
    }

    static getNameWithoutCopyNumber(name: string) {
        const replacedName = name.replace(
            // eslint-disable-next-line no-useless-escape
            /\s\(COPY\s[^)]+\)$/g,
            '',
        );

        return replacedName;
    }

    static getCopyNumber(name: string) {
        // eslint-disable-next-line no-useless-escape
        const match = name.match(/\s\(COPY\s([^)]+)\)$/);

        if (match) {
            return Number(match[1]);
        } else {
            return 0;
        }
    }

    static setCopyNumber(name: string, count: number) {
        if (count === 0) {
            return name;
        } else {
            return `${name} ${COPY_START} ${count}${COPY_END}`;
        }
    }

    static renameKey({key, name, scope}: {key: string; name: string; scope: EntryScope}) {
        const parentFolderKey = this.getParentFolderKey({
            keyFormatted: this.formatKey(key, true),
        });

        return this.formatKey(`${parentFolderKey}${name}`, scope === 'folder');
    }

    static rotate(array: any[], n: number) {
        let rotatedArray = [];

        if (Array.isArray(array)) {
            rotatedArray = array.slice(n, array.length).concat(array.slice(0, n));
        }

        return rotatedArray;
    }

    static async macrotasksMap<T, R extends (item: T) => unknown>(
        arr: T[],
        cb: R,
        chunkSize = 1000,
    ): Promise<ReturnType<R>[]> {
        const chunks = chunk(arr, chunkSize);
        const results: ReturnType<R>[] = [];
        for (const chunkItem of chunks) {
            const items = (await new Promise((resolve, reject) => {
                function done() {
                    try {
                        resolve(chunkItem.map(cb));
                    } catch (error) {
                        reject(error);
                    }
                }
                if (chunkItem === chunks[0]) {
                    done();
                } else {
                    setImmediate(done);
                }
            })) as unknown as ReturnType<R>[];
            results.push(...items);
        }
        return results;
    }

    static async macrotasksForEach<T>(
        arr: T[],
        cb: (item: T) => unknown,
        chunkSize = 1000,
    ): Promise<void> {
        const chunks = chunk(arr, chunkSize);
        for (const chunkItem of chunks) {
            await new Promise<void>((resolve, reject) => {
                function done() {
                    try {
                        for (const item of chunkItem) {
                            cb(item);
                        }
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                }

                if (chunkItem === chunks[0]) {
                    done();
                } else {
                    setImmediate(done);
                }
            });
        }
    }

    static waitNextMacrotask = async () => {
        return new Promise((resolve) => {
            setImmediate(resolve);
        });
    };

    static encodeId(bigIntId: any) {
        let encodedId = '';

        if (bigIntId) {
            const bigIntIdShortPart: any = bigIntId.slice(-2);

            const rotationNumber = bigIntIdShortPart % CODING_BASE.length;
            const rotatedCodingBase = Utils.rotate(CODING_BASE, rotationNumber);

            const encodedLongPart = new PowerRadix(bigIntId, 10).toString(rotatedCodingBase);
            const encodedRotationNumber = new PowerRadix(rotationNumber, 10).toString(Utils.base);

            encodedId = encodedLongPart + encodedRotationNumber;
        }

        return encodedId;
    }

    static decodeId(id: string) {
        let decodedId = '';

        if (id) {
            if (id.length !== ENCODED_ID_LENGTH) {
                throw new AppError('The ID must consist of 13 characters.', {
                    code: US_ERRORS.DECODE_ID_FAILED,
                });
            }

            const encodedRotationNumber = id.slice(-1);
            const encodedLongPart = id.slice(0, -1);

            const decodedRotationNumber = new PowerRadix(
                encodedRotationNumber,
                CODING_BASE,
            ).toString(10);
            const rotatedCodingBase = Utils.rotate(CODING_BASE, decodedRotationNumber);

            const decodedLongPart = new PowerRadix(encodedLongPart, rotatedCodingBase).toString(10);

            decodedId = decodedLongPart;
        }

        return decodedId;
    }

    /** @deprecated use macrotasksEncodeMapIds */
    static encodeMapIds(object: {[key: string]: any}) {
        return Object.keys(object).reduce(function (result, bigInt) {
            const encodedId = Utils.encodeId(bigInt);

            return {...result, [encodedId]: object[bigInt]};
        }, {});
    }

    static async macrotasksEncodeMapIds(object: Record<string, unknown>) {
        const ids = await Utils.macrotasksMap(Object.keys(object), (bigInt: string) => ({
            bigInt,
            encodedId: Utils.encodeId(bigInt),
        }));
        return ids.reduce<Record<string, unknown>>((result, id) => {
            result[id.encodedId] = object[id.bigInt];
            return result;
        }, {});
    }

    static encodeIds(object: {[key: string]: any}) {
        for (const idVariable of Utils.idVariables) {
            if (object && object[idVariable]) {
                const id = object[idVariable];
                object[idVariable] = id && Utils.encodeId(id);
            }
        }

        return object;
    }

    /** @deprecated use macrotasksEncodeData */
    static encodeData(data: any) {
        let dataFormed;

        if (Array.isArray(data)) {
            dataFormed = data.map(Utils.encodeIds);
        } else if (data !== null && typeof data === 'object') {
            dataFormed = Utils.encodeIds(data);
        } else {
            dataFormed = data;
        }

        return dataFormed;
    }

    static async macrotasksEncodeData(data: any) {
        let dataFormed;

        if (Array.isArray(data)) {
            dataFormed = await Utils.macrotasksMap(data, Utils.encodeIds);
        } else if (data !== null && typeof data === 'object') {
            dataFormed = Utils.encodeIds(data);
        } else {
            dataFormed = data;
        }

        return dataFormed;
    }

    static generateLockToken() {
        return (
            Math.random().toString(36).substring(2, 10) +
            Math.random().toString(36).substring(2, 10)
        );
    }

    /** @deprecated moved to env-utils */
    static isTrueArg(arg: any): boolean {
        return TRUE_FLAGS.includes(arg);
    }

    static async sleep(ms: number) {
        return new Promise((resolve) => setTimeout(() => resolve(ms), ms));
    }

    static displayTime(time: [number, number], index?: number) {
        let formatStr = '\x1b[33m %ds %dms';

        if (typeof index === 'number') {
            formatStr = `\x1b[33m ${index + 1} ${formatStr}`;
        }

        console.log(formatStr, time[0], time[1] / 1000000);
    }

    static hrTime(name: string, display = false) {
        const hrTime = process.hrtime();
        let deltaTime;

        if (PROFILES[name]) {
            const {hrTime: beforeTime} = PROFILES[name].slice(-1)[0];

            deltaTime = process.hrtime(beforeTime);
        } else {
            deltaTime = process.hrtime(hrTime);

            PROFILES[name] = [];
        }

        PROFILES[name].push({
            hrTime,
            deltaTime,
        });

        if (display) {
            Utils.displayTime(deltaTime);
        }
    }

    static getHrTimes(name: string) {
        if (PROFILES[name]) {
            PROFILES[name].map((profileTime: any, index: number) => {
                const {deltaTime} = profileTime;

                return Utils.displayTime(deltaTime, index);
            });
        }
    }

    static getDuration(hrStart: [number, number]) {
        const hrDuration = process.hrtime(hrStart);
        return (hrDuration[0] * 1e9 + hrDuration[1]) / 1e6;
    }

    static extractResponseBody(response: USAPIResponse) {
        return response && response.body;
    }

    /** @deprecated moved to env-utils */
    static getEnvVariable(envVariableName: string) {
        const valueFromEnv = process.env[envVariableName];
        if (valueFromEnv) {
            return valueFromEnv;
        }
        const FILE_PATH_POSTFIX = '_FILE_PATH';
        const filePath = process.env[`${envVariableName}${FILE_PATH_POSTFIX}`];
        if (filePath) {
            return fs.readFileSync(filePath, 'utf8') as string;
        }
        return undefined;
    }

    /** @deprecated moved to env-utils */
    static getEnvTokenVariable(envTokenVariableName: string) {
        const TOKEN_SEPARATOR = ',';
        const valueFromEnv = Utils.getEnvVariable(envTokenVariableName);

        if (!valueFromEnv) {
            return undefined;
        }

        if (valueFromEnv.includes(TOKEN_SEPARATOR)) {
            return valueFromEnv
                .split(TOKEN_SEPARATOR)
                .map((token) => token && token.trim())
                .filter((token) => token);
        }

        return [valueFromEnv.trim()];
    }

    static getDsnList() {
        let dsnList;
        const pgRdsConfigPath = process.env.POSTGRES_RDS_CONFIG_PATH;

        if (pgRdsConfigPath) {
            const pgRdsConfig = JSON.parse(fs.readFileSync(pgRdsConfigPath));
            const pgHost = pgRdsConfig.host;
            const pgPort = pgRdsConfig.port;
            const pgDb = pgRdsConfig.dbname;
            const pgPassword = pgRdsConfig.password;
            const pgUsername = pgRdsConfig.username;
            dsnList = `postgres://${pgUsername}:${pgPassword}@${pgHost}:${pgPort}/${pgDb}?ssl=true`;
        } else if (
            process.env.POSTGRES_HOSTS &&
            process.env.POSTGRES_PORT &&
            process.env.POSTGRES_USER_PASSWD &&
            process.env.POSTGRES_USER_NAME &&
            process.env.POSTGRES_DB_NAME
        ) {
            dsnList = process.env.POSTGRES_HOSTS.split(',')
                .map((host) => {
                    return `postgres://${process.env.POSTGRES_USER_NAME}:${
                        process.env.POSTGRES_USER_PASSWD
                    }@${host}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB_NAME}${
                        process.env.POSTGRES_DISABLE_SSL ? '' : '?ssl=true'
                    }`;
                })
                .join(',');
        } else {
            dsnList = process.env.POSTGRES_DSN_LIST;
        }

        if (!dsnList) {
            throw new Error('Missing POSTGRES_DSN_LIST in env');
        }

        return dsnList;
    }

    static getOptimisticNextPageToken({
        page,
        pageSize,
        curPage,
    }: {
        page: number;
        pageSize: number;
        curPage: unknown[];
    }) {
        let nextPageToken;

        if (page >= 0 && curPage.length === pageSize) {
            nextPageToken = String(page + 1);
        }

        return nextPageToken;
    }

    static escapeStringForLike(str: string) {
        return str.replace(/[%_]/g, '\\$&');
    }

    static escapeStringRegexp(str: string) {
        return str.replace(/[!$()*+.:<=>?[\\\]^{|}-]/g, '\\$&');
    }

    static camelCase(str: string) {
        const wordPattern = new RegExp(
            ['[A-Z][a-z]+', '[A-Z]+(?=[A-Z][a-z])', '[A-Z]+', '[a-z]+', '[0-9]+'].join('|'),
            'g',
        );
        const words = str.match(wordPattern) || [];
        return words
            .map((word, index) => (index === 0 ? word : word[0].toUpperCase() + word.slice(1)))
            .join('');
    }

    static isFileConnection(entry: {scope: EntryScope; type: string}) {
        const fileConnectionTypes: string[] = [
            EntryType.File,
            EntryType.GsheetsV2,
            EntryType.YaDocs,
        ];

        return (
            entry.scope === EntryScopeEnum.Connection && fileConnectionTypes.includes(entry.type)
        );
    }

    static checkFileConnectionsExistence(entries: {scope: EntryScope; type: string}[]) {
        return entries.some((entry) => {
            return Utils.isFileConnection(entry);
        });
    }

    static getTimestampInSeconds = () => {
        return Math.floor(new Date().getTime() / 1000);
    };

    static getCorrectedPageLimit = (limit?: number, maxPageLimit = MAX_PAGE_LIMIT) => {
        return limit ? Math.min(Math.abs(limit), maxPageLimit) : maxPageLimit;
    };

    static replaceIds = async (
        oldByNewIdMap: Map<string, string>,
        array: Record<string, unknown>[],
    ) => {
        if (array.length === 0 || oldByNewIdMap.size === 0) {
            return array;
        }

        await Utils.waitNextMacrotask();

        let strCopiedJoinedEntryRevisions = JSON.stringify(array);

        const oldIds = Array.from(oldByNewIdMap.keys());

        await Utils.waitNextMacrotask();

        const regex = new RegExp(`(${oldIds.join('|')})`, 'g');

        strCopiedJoinedEntryRevisions = strCopiedJoinedEntryRevisions.replace(regex, (match) => {
            return oldByNewIdMap.get(match) || match;
        });

        await Utils.waitNextMacrotask();

        return JSON.parse(strCopiedJoinedEntryRevisions);
    };
}
