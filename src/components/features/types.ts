export enum Feature {
    ReadOnlyMode = 'ReadOnlyMode',
    CollectionsEnabled = 'CollectionsEnabled',
    ColorPalettesEnabled = 'ColorPalettesEnabled',
    UseIpV6 = 'UseIpV6',
    WorkbookIsolationEnabled = 'WorkbookIsolationEnabled',
    GetEntryV2Enabled = 'GetEntryV2Enabled',
}

export type FeaturesConfig = {
    [key in Feature]?: boolean;
};
