import { OGNhanVienModel } from "../nhan-vien.model";

interface OGSoNhatKyTuanDuongModel {
    created_at?: Date | string;
    denkm? : string;
    donvivanhanh?: string;
    id: number;
    masonhatky? : string;
    ngaykiemtra?: Date | string;
    nhanVien?: OGNhanVienModel;
    nhanvientuanduongid?: number;
    quoclo?: string;
    suCoViPhams?: OGSuCoViPhamTuanDuongModel[]
    thoitiet?: string;
    tukm?: string;
    updated_at?: Date | string;
}

interface OGSuCoViPhamTuanDuongModel {
    created_at?: Date | string;
    ghichu?: string;
    id: number;
    ketquagiaiquyet?: string;
    loaisucoviphamid?: string;
    nhanxetvieccanluuy?: string;
    nhatKyTuanDuong?: OGSoNhatKyTuanDuongModel
    noidungsuco?: string;
    sonhatkyid?: number;
    tinhtranggiaiquyet?: string;
    updated?: Date | string;
    vitrilytrinh?: string;
}

export { 
    OGSoNhatKyTuanDuongModel,
    OGSuCoViPhamTuanDuongModel
};