export enum Feature {
    ReadOnlyMode = 'ReadOnlyMode',
    CollectionsEnabled = 'CollectionsEnabled',
    ColorPalettesEnabled = 'ColorPalettesEnabled',
    UseIpV6 = 'UseIpV6',
    ProjectsEnabled = 'ProjectsEnabled',
    UseLimitedView = 'UseLimitedView',
}

export type FeaturesConfig = {
    [key in Feature]?: boolean;
};
