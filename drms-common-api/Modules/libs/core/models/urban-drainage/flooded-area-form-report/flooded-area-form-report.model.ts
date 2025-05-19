class OGFloodedLocationModel {
    anhminhhoa?: string;
    caodomdngap?: string;
    commune_code?: string;
    diachi?: string;
    dientich?: number;
    district_code?: string;
    donvixulyid?: string;
    dosau?: number;
    dungtich?: number;
    hientrangid?: string;
    hopdongid?: string;
    kichbanngap?: string;
    luonngmua?: Date | string;
    mavungngap?: number;
    ngaycapnhat?: Date | string;
    objectid?: number;
    phanloaiid?: string;
    phieugiamsatid?: string;
    province_code?: string;
    sohieuduong?: string;
    tenvungngaplut?: string;
    thoigianngap?: Date | string;
    tinhtrangid?: string;
    tuyenid?: string;
}
class OGFloodedAreaFormReportModel {
    area_id?: string;
    communes: OGFloodedAreaFormReportCommuneModel[];
    name_vn?: string;
    stt?: string;
}

class OGFloodedAreaFormReportCommuneModel {
    area_id?: string;
    datas?: OGFloodedLocationModel[];
    name_vn?: string;
    stt?: string;
}
export {
    OGFloodedAreaFormReportModel,
};