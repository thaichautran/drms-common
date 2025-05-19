import { BaseCategory } from "./base-category.model";

class DanhSachBanDo {
    id?: number;
    loai_bando_id?: number;
    loaiBanDo?: BaseCategory;
    mo_ta?: string;
    nam_xaydung?: number;
    raw?: File;
    ten_bando?: string;
    tenfile_goc?: string;
    tenfile_luutru?: string;
    url?: string;
}

export { DanhSachBanDo };