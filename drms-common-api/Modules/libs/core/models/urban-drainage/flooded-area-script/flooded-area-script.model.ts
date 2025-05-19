class OGFloodedAreaScriptModel {
    attachments: OGFloodedAreaScriptAttachmentModel[];
    commune_code?: string;
    district_code?: string;
    files: [];
    geom?: string;
    id?: number;
    luong_mua?: number;
    ngay_tao?: Date | string;
    province_code?: string;
    ten_kichban?: string;
}

class OGFloodedAreaScriptAttachmentModel {
    allowedDelete?: boolean;
    extension?: string;
    id?: number;
    kichban_id?: number;
    mime_type?: string;
    raw?: Blob;
    tenfile_goc?: string;
    url?: string;
}

export {
    OGFloodedAreaScriptAttachmentModel,
    OGFloodedAreaScriptModel,
};