import { OGNhanVienModel } from "../nhan-vien.model";

interface OGSuCoGiaoThongModel {
    chitietsuco?: string;
    commune_code?: string;
    daguiyeucauxuly?: boolean;
    district_code?: string;
    ghichu?: string;
    giaiquyethauqua?: string;
    hauquacongtrinhduongbo?: string;
    hauquagiaothong?: string;
    hauquanguoi?: string;
    hauquaphuongtien?: string;
    hientrangtuyen?: string;
    hientruongsuco?: string;
    id: number;
    loaisucoid?: string;
    lytrinh?: string;
    masuco?: string;
    nguyennhan?: string;
    province_code?: string;
    thoigianxayra?: Date | string;
    trangthaiid?: string;
}

interface OGGiaoViecXuLySuCoModel {
    bienphapkhacphuc?: string;
    ghichu?: string;
    id? : number;
    nhanVienXuLySuCos?: OGNhanVienXuLySuCoModel[];
    nhanvien_ids? : number[];
    suCo?: OGSuCoGiaoThongModel;
    sucoid? : number;
    thoigiangiaoviec?: Date | string;
    thoigianhoanthanh? : Date| string;
    thoihanxuly?: Date| string;
}

interface OGNhanVienXuLySuCoModel {
    nhanVien? : OGNhanVienModel;
    nhanvienid: number;
    phieuGiaoViec? : OGGiaoViecXuLySuCoModel
    phieugiaoviecid? : number;
}

export { 
    OGGiaoViecXuLySuCoModel, 
    OGNhanVienXuLySuCoModel,
    OGSuCoGiaoThongModel
};