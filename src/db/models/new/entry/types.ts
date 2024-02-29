export enum EntryScope {
    Connection = 'connection',
    Dataset = 'dataset',
    Widget = 'widget',
    Dash = 'dash',
    Folder = 'folder',
    Config = 'config',
    Pdf = 'pdf',
}

// "type" is a string field and value can be any string, this enum is only used for checks in code
export enum EntryType {
    File = 'file',
    GsheetsV2 = 'gsheets_v2',
    YaDocs = 'yadocs',
    // types can be added as needed
}
