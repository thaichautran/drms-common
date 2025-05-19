class OGNhanVienModel {
    chucvu?: string;
    diachi?: string;
    donvicongtac?: string;
    id: number;
    loainhanvien_id?: number;
    sodienthoai?: string;
    tennhanvien?: string;
}

class OGChamCongModel {
    chamcong?: boolean;
    ghichu?: string;
    id: number;
    ngay?: Date | string;
    nhanvien_id?: string;
    tennhanvien?: string;
}

class OGGiamSatNhanVienModel {
    congvieckiemtra?: string;
    ghichu?: string;
    id: number;
    nhanvien_id?: string;
    tennhanvien?: string;
    thoigian_ketthuc?: Date | string;
    thoigian_thuchien?: Date | string;
}
export {
    OGChamCongModel,
    OGGiamSatNhanVienModel,
    OGNhanVienModel
};