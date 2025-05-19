interface OGFileModel {
    extension?: string;
    file?: Blob |File,
    file_name?: string,
    mime_type?: string,
    size?: number,
    uid?: string,
    url?: ArrayBuffer| string
}

export {
    OGFileModel,
};