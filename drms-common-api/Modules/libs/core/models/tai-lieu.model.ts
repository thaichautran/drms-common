import { AreaModel } from "./area.model";
import { BaseCategory } from "./base-category.model";

class TaiLieu {
    donViPhatHanh?: BaseCategory;
    donvi_phathanh_id?: number;
    ghi_chu?: string;
    id?: number;
    linhVuc?: BaseCategory;
    linhvuc_id?: number;
    listCapHanhChinh?: TaiLieuCapHanhChinh[];
    nam_tailghi_chuieu?: string;
    nam_tailieu?: number;
    ngay_hieuluc?: Date;
    ngay_phathanh?: string;
    noi_dung?: string;
    phanLoaiTaiLieu?: BaseCategory;
    phanloai_tailieu_id?: number;
    raw?: File;
    so_vanban?: string;
    ten_tailieu?: string;
    tenfile_goc?: string;
    tenfile_luutru?: string;
    tinhTrangTaiLieu?: BaseCategory;
    tinhtrang_tailieu_id?: number;
    url?: string;
}

interface TaiLieuCapHanhChinh {
    commune?: AreaModel;
    commune_code?: string;
    district?: AreaModel;
    district_code?: string;
    id?: number;
    province?: AreaModel;
    province_code?: string;
    taiLieu?: TaiLieu;
    tailieu_id?: number;
}

export {
    TaiLieu,
    TaiLieuCapHanhChinh
};