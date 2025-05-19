import { AreaModel } from "./area.model";
import { BaseCategory } from "./base-category.model";

class SanPham {
    commune?: AreaModel;
    commune_code?: string;
    district?: AreaModel;
    district_code?: string;
    id?: number;
    listFiles: SanPhamDinhKem[];
    mo_ta?: string;
    ten_sanpham?: string;
}

interface SanPhamDinhKem {
    extension?: string;
    id?: number;
    loai_sanpham_id?: number;
    loaiSanPham?: BaseCategory;
    raw?: File;
    sanpham_id?: number;
    tenfile_goc?: string;
    tenfile_luutru?: string;
    url?: string;
}

export {
    SanPham,
    SanPhamDinhKem
};