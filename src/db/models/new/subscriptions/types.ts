export enum SubscriptionStatus {
    Active = 'active',
    Stopped = 'stopped',
    Suspended = 'suspended',
}

export enum SubscriptionContentType {
    Dash = 'dash',
    Chart = 'chart',
    Report = 'report',
}

export enum SubscriptionTriggerType {
    Cron = 'cron',
    DatasetRefresh = 'dataset_refresh',
    Threshold = 'threshold',
    Relative = 'relative',
    NonEmpty = 'non_empty',
    IsTrue = 'is_true',
}

export enum SubscriptionArtifactType {
    Png = 'png',
}
