export enum Feature {
    ReadOnlyMode = 'ReadOnlyMode',
    CollectionsEnabled = 'CollectionsEnabled',
    ColorPalettesEnabled = 'ColorPalettesEnabled',
    UseIpV6 = 'UseIpV6',
    UseLimitedView = 'UseLimitedView',
    WorkbookIsolationEnabled = 'WorkbookIsolationEnabled',
}

export type FeaturesConfig = {
    [key in Feature]?: boolean;
};
