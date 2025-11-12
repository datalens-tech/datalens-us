export enum LicenseLimitType {
    Regular = 'regular',
    Forced = 'forced',
}

export type LicenseLimitMeta = {
    prevState?: {
        creatorsLimitValue: number;
    };
};
