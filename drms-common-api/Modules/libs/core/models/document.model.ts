class OGDocumentModel {
    attachment_url?: string;
    attachments: OGAttachmentModel[];
    code?: string;
    created_at?: Date | string;
    description?: string;
    extension: string;
    files: Blob[];
    ghi_chu?: string;
    id?: number;
    loai_hoso: OGDanhMucModel;
    loai_hoso_id: number;
    ngay_banhanh?: Date | string;
    ngay_hieuluc?: Date | string;
    nguoiky?: string;
    nhom_hoso: OGDanhMucModel;
    nhom_hoso_id: number;
    short_description?: string;
    title?: string;
    updated_at?: Date | string;
    visible?: boolean;
}
class OGDanhMucModel {
    id: number;
    mo_ta: string;
}

class OGAttachmentModel {
    allowedDelete?: boolean;
    extension?: string;
    file_name?: string;
    ho_so?: OGDanhMucModel;
    hoso_id?: number;
    id?: number;
    mime_type?: string;
    raw?: Blob;
    size?: number;
    store_file_name?: string;
    url?: string;
}

class HoSoKySo {
    extension?: string;
    file_name?: string;
    ho_so?: OGDanhMucModel;
    hoso_id?: number;
    id?: number;
    mime_type?: string;
    raw?: Blob;
    size?: number;
    store_file_name?: string;
    url?: string;
}

export {
    HoSoKySo,
    OGAttachmentModel,
    OGDanhMucModel,
    OGDocumentModel
};