import { OGNhanVienModel } from "../nhan-vien.model";

class OGKeHoachKiemTraModel {
    public attachments?: OGKeHoachKiemTraDinhKemModel[];
    public congTrinhs?: OGKeHoachCongTrinhModel[];
    public diadiemthuchien?: string;
    public ghichu?: string;
    public id: number;
    public listCongViec?: OGKeHoachCongViecModel[];
    public loaikehoach?: string;
    public magoithau?: string;
    public mahopdong?: string;
    public ngaybatdau?: Date | string;
    public ngayketthuc?: Date | string;
    public ngaylapkehoach?: Date | string;
    public nguoilapkehoach?: string;
    public nhanViens?: OGKeHoachNhanVienModel[];
    public noidung?: string;
    public tenkehoach?: string;
}
class OGKeHoachNhanVienModel {
    ghichu?: string;
    keHoachKiemTra?: OGKeHoachKiemTraModel;
    kehoach_id?: number;
    nhanVien?: OGNhanVienModel;
    nhanvien_id?: number;
}

class OGKeHoachCongTrinhModel {
    feature_id?: string;
    feature_name?: string;
    id?: number;
    keHoachKiemTra?: OGKeHoachKiemTraModel;
    kehoach_id?: number;
    table_id?: number;
    table_name?: string;
    uid?: string;
}

class OGKeHoachCongViecModel {
    congviec_id: number;
    donvi?: string;
    dutoan: number;
    id: number;
    kehoach_id: number;
    khoiluong_thuchien: number;
    thoigian_thuchien: Date;
}

class OGKeHoachKiemTraDinhKemModel {
    extension: string;
    file: File;
    file_name?: string;
    id?: number;
    keHoach?: OGKeHoachKiemTraModel;
    kehoach_id?: number;
    mime_type: string;
    raw: File;
    size: number;
    url: string;
}

class OGNhaThau {
    code?: string;
    loaikehoach?: string;
    value?: string;
}
export {
    OGKeHoachCongTrinhModel,
    OGKeHoachCongViecModel,
    OGKeHoachKiemTraDinhKemModel,
    OGKeHoachKiemTraModel,
    OGKeHoachNhanVienModel,
    OGNhaThau
};