class OGProblemsLocationModel {
    commune_code? : string;
    created_at? : Date | string;
    diachi?: string;
    district_code? : string;
    field?: string;
    ghichu? : string;
    hientrangid?: number;
    layer_id?: number;
    loaicongtrinh_id?: number;
    loaisuco?: string;
    mavitrisuco?: string;
    objectid?: number;
    phanloaiid?: number;
    province_code? : string;
    sohieuduong? : string;
    updated_at? : Date | string;
    vitri?: string;
}

class OGProblemReportModel {
    area_id?: string;
    communes: OGProblemReportCommuneModel[];
    name_vn?: string;
    stt?: string;
}

class OGProblemReportCommuneModel {
    area_id?: string;
    datas?: OGProblemsLocationModel[];
    name_vn?: string;
    stt?: string;
}

export { OGProblemReportModel };