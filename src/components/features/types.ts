export enum Feature {
    ReadOnlyMode = 'ReadOnlyMode',
    ColorPalettesEnabled = 'ColorPalettesEnabled',
    UseIpV6 = 'UseIpV6',
    WorkbookIsolationEnabled = 'WorkbookIsolationEnabled',
    TenantsEnabled = 'TenantsEnabled',
    TemporalEnabled = 'TemporalEnabled',
    DynamicMasterTokenEnabled = 'DynamicMasterTokenEnabled',
    DynamicMasterTokenIsRequired = 'DynamicMasterTokenIsRequired',
}

export type FeaturesConfig = {
    [key in Feature]?: boolean;
};
