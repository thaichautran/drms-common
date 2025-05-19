class DocumentLGSP {
    attachments: AttachmentLGSP[];
    bussiness?: number;
    bussiness_doc_reason?: string;
    code?: string;
    document_id?: string;
    files: Blob[];
    id?: number;
    organ_id?: string;
    promulgation_date?: Date;
    response_for?: string;
}

class AttachmentLGSP {
    allowedDelete?: boolean;
    extension?: string;
    file_name?: string;
    ho_so?: DocumentLGSP;
    hoso_id?: number;
    id?: number;
    mime_type?: string;
    raw?: Blob;
    size?: number;
    store_file_name?: string;
    url?: string;
}

export {
    AttachmentLGSP,
    DocumentLGSP,
};