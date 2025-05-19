interface ThuMucModel {
    created_at?: Date;
    id: number;
    listDinhKem?: ThuMucDinhKemModel[]
    mo_ta?: string;
    updated_at?: Date;
}

interface ThuMucDinhKemModel {
    extension?: string;
    file_name?: string;
    ho_so?: ThuMucModel;
    id?: number;
    mime_type?: string;
    // raw?: Blob;
    size?: number;
    store_file_name?: string;
    thumuc_id?: number;
    url?: string;
}

export {
    ThuMucDinhKemModel,
    ThuMucModel
};