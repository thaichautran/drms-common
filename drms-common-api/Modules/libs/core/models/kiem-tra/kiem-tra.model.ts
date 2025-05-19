import { IdentifyComponent } from "../../components/identify/identify.component";
import { OGCatgoryModel } from "../category.model";
import { OGConfigModel } from "../config.model";
import { OGAttachmentModel } from "../document.model";
import { OGNhanVienModel } from "../nhan-vien.model";
import { OGPhieuGiamSatKiemTraCayXanhModel } from "./phieu-kiem-tra-cay-xanh.model";
import { OGPhieuGiamSatKiemTraChieuSangModel } from "./phieu-kiem-tra-chieu-sang.model";
import { OGPhieuGiamSatKiemTraThoatNuocModel } from "./phieu-kiem-tra-thoat-nuoc.model";

class OGPhieuKiemTraModel {
    public anhMinhHoas?: OGHoSoKiemTraModel[];
    public anhminhhoa?: string;
    public congTrinhBaoDuongs?: OGCongTrinhBaoDuongModel[];
    public congcukiemtra?: string;
    public danhgiachatluongthugomrac?: string;
    public deleteAnhMinhHoaIds?: number[];
    public deleteHoSoQuanLyIds?: number[];
    public diadiem?: string;
    public donvithicong?: string;
    public ghichu?: string;
    public giaoViecNhanViens?: OGGiaoViecNhanVienModel[];
    public goithauso?: number;
    public hoSoQuanLys?: OGHoSoKiemTraModel[];
    public id?: number;
    public kiemtracongtacatgt?: string;
    public kiemtracongtacatld?: string;
    public kiemtractvsmtkhuvuctc?: string;
    public ngayketthuc?: Date | string;
    public ngaythuchien?: Date | string;
    public nhathau?: string;
    public phuongthuckiemtra?: string;
    public sonhancong?: number;
    public tencongtrinh?: string;
    public thietbi?: string;
    public thoitiet?: string;
    public thongTinTraoDois?: OGThongTinTraoDoiModel[];
    public trangthaicongviec?: number;
    public vitri?: string;
}
class OGGiaoViecNhanVienModel {
    ghichu?: string;
    nhanVien?: OGNhanVienModel;
    nhanvien_id?: number;
    phieuGiamSat: OGPhieuGiamSatKiemTraCayXanhModel | OGPhieuGiamSatKiemTraChieuSangModel | OGPhieuGiamSatKiemTraThoatNuocModel;
    phieugiamsat_id?: number;
}
class OGHoSoKiemTraModel {
    extension?: string;
    file?: Blob | File;
    file_name?: string;
    id?: number;
    loaiHoSo?: OGCatgoryModel;
    loaihoso_id?: number;
    loaikiemtra?: string;
    mime_type?: string;
    phieuGiamSat?: OGPhieuGiamSatKiemTraCayXanhModel | OGPhieuGiamSatKiemTraChieuSangModel | OGPhieuGiamSatKiemTraThoatNuocModel;
    phieugiamsat_id?: number;
    raw?: object;
    size: number;
    uid?: string;
    url?: string;
}

class OGThongTinTraoDoiModel {
    date_create_txt?: string;
    datetime_create_txt?: string;
    file?: Blob | File;
    full_image_url?: string;
    id?: number;
    image_url?: string;
    message?: string;
    phieuGiamSat?: OGPhieuGiamSatKiemTraCayXanhModel | OGPhieuGiamSatKiemTraChieuSangModel | OGPhieuGiamSatKiemTraThoatNuocModel;
    phieugiamsat_id?: number;
    time_create_txt?: string;
    uid?: string;
    user_cr_dtime?: Date | string;
    user_id?: string;
    user_name?: string;
}

class OGMaintenanceViewOptions {
    config: OGConfigModel;
    identify?: IdentifyComponent;
    loaiKiemTra?: string;
    loaiNhanVienId?: number;
    mapId?: number;
}

class OGCongTrinhBaoDuongModel {
    feature_id?: string;
    feature_name?: string;
    id?: number;
    loaikiemtra?: string;
    phieugiamsat_id?: number;
    table_id?: number;
    table_name?: string;
    uid?: string;
}

class OGDuToanCongViecSuaChua {
    attachments?: OGAttachmentModel[];
    files?: Blob[];
    ghichu?: string;
    id?: number;
    loaikiemtra?: string;
    madutoan?: string;
    ngaylapdutoan?: Date | string;
    nguoilapdutoan?: Date | string;
    phieugiamsat_id?: number;
    tendutoan?: string;
}
export {
    OGCongTrinhBaoDuongModel,
    OGDuToanCongViecSuaChua,
    OGGiaoViecNhanVienModel,
    OGHoSoKiemTraModel,
    OGMaintenanceViewOptions,
    OGPhieuKiemTraModel,
    OGThongTinTraoDoiModel
};