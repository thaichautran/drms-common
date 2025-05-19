class TuyNenKyThuatModel {
    anhminhhoa?: string;
    caododay? : string;
    caododinh? : string;
    commune_code? : string;
    created_at: Date | string;
    diachi? : string;
    district_code? : string;
    donviquanlyid? : string;
    donvivanhanh? : string;
    dungluongthietke? : string;
    hethongcongbe? : string;
    hientrangid?: string;
    kichthuoc: number;
    matuynen? : string;
    ngaycapnhat? : Date | string;
    ngayvanhanh? : Date | string;
    objectid? : number;
    province_code? : string;
    tuynenkythuat? : number;
    updated_at: Date | string;
    vitriganivo? : string;
}

class OGAssetsReportModel {
    area_id?: string;
    communes: OGAssetsReportCommuneModel[];
    name_vn?: string;
    stt?: string;
}

class OGAssetsReportCommuneModel {
    area_id?: string;
    hienTrangs?: OGAssetsReportStatusModel[];
    name_vn?: string;
    stt?: string;
}

class OGAssetsReportStatusModel {
    datas?: TuyNenKyThuatModel[];
    mo_ta? : string;
    stt?: string;
}

export { OGAssetsReportModel };