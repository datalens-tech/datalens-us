export enum Feature {
    ReadOnlyMode = 'ReadOnlyMode',
    CollectionsEnabled = 'CollectionsEnabled',
    ColorPalettesEnabled = 'ColorPalettesEnabled',
    UseIpV6 = 'UseIpV6',
    WorkbookIsolationEnabled = 'WorkbookIsolationEnabled',
    DefaultColorPaletteEnabled = 'DefaultColorPaletteEnabled',
}

export type FeaturesConfig = {
    [key in Feature]?: boolean;
};
