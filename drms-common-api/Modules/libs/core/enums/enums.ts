import { Circle, Fill, Stroke, Style, Text } from "ol/style";

const NO_DATA = "Thông tin sẽ được cập nhật trong quá trình vận hành";
const INVALID_TOKEN_ERROR_CODE = 498;

enum EnumDataType {
    bool = "boolean",
    date = "date",
    dateTime = "timestamp without time zone",
    dateTimeTZ = "timestamp with time zone",
    double = "double precision",
    integer = "integer",
    smallint = "smallint",
    string = "character varying",
    text = "text",
}
enum EnumWebOption {
    APP_CONFIG = "app_config",
    BACKUP_FREQUENCY = "backup_frequency",
    BACKUP_SAVE_PATH = "backup_save_path",
    REPORT_MONTH = "report_month",
    REPORT_OTHER = "report_other",
    REPORT_QUARTER = "report_quarter",
    REPORT_SIX_MONTH = "report_six_month",
    REPORT_SUDDENLY = "report_suddenly",
    REPORT_YEAR = "report_year",
    SITE_DESCRIPTION = "site_description",
    SITE_NAME = "site_name",
    SMS_CONFIG = "sms_config",
    SMTP_PASSWORD = "smtp_password",
    SMTP_PORT = "smtp_port",
    SMTP_SERVER = "smtp_server",
    SMTP_USER_NAME = "smtp_user_name",
    VRAIN_API = "vrain_api",
    VRAIN_CRON = "vrain_cron",
    VRAIN_KEY = "vrain_key",
}
const Operator = {
    equal: 3,
    great: 1,
    less: 2
};

const EnumCustom = {
    charDefaultLength: 256,
};

const EnumGetDataType = {
    idGetAll: -1,
    odich_anhhuong: -2
};

const EnumTypeOf = {
    array: "object",
    boolean: "boolean",
    null: "object",
    number: "number",
    object: "object",
    string: "string",
    undefined: "undefined"
};

enum EnumImportFileType {
    EXCEL = "Excel",
    GDB = "GDB",
    SHAPEFILE = "Shapefile",
}

enum EnumGeometry {
    LineString = "LineString",
    MultiLineString = "MultiLineString",
    MultiPoint = "MultiPoint",
    MultiPolygon = "MultiPolygon",
    Point = "Point",
    Polygon = "Polygon"
}
const EnumsFunction = {
    ADD: "add",
    DATA: "data",
    DELETE: "delete",
    REPORT: "report",
    UPDATE: "update",
};
const EnumStatus = {
    ERROR: "ERROR",
    OK: "OK"
};

const EnumDefaultStyle = {
    FillStyle: new Style({
        fill: new Fill({
            color: "rgba(0, 0, 255, 0.1)",
        }),
        stroke: new Stroke({
            color: "blue",
            width: 3,
        }),
    }),

    LineStyle: new Style({
        stroke: new Stroke({
            color: "#ffcc33",
            width: 2,
        }),
    }),

    PointStyle: new Style({
        // fill: new Fill({
        //     color: "rgba(255,255,255,0.4)",
        // }),
        image: new Circle({
            fill: new Fill({
                color: "rgba(255, 255, 255, 0.7)"
            }),
            radius: 5,
            stroke: new Stroke({
                color: "rgba(37, 62, 144, 1)",
                width: 2,
            }),
        }),
        // stroke: new Stroke({
        //     color: "#3399CC",
        //     width: 1.25,
        // }),
    }),


    TextStyle: new Style({
        image: new Circle({
            fill: new Fill({ color: "#666666" }),
            radius: 5,
            stroke: new Stroke({ color: "#bada55", width: 1 })
        }),
        text: new Text({
            fill: new Fill({
                color: "#dddddd"
            }),
            font: "12px 'Reddit Sans'",
            offsetX: 0,
            offsetY: 0,
            overflow: true,
            stroke: new Stroke({
                color: "#000000",
                width: 2
            }),
            text: "Xem trước"
        })
    }),
};
const EnumDanhMuc = {
    CONGCUKIEMTRA: 10,
    DONVIQUANLY: 7,
    HINHTHUCKIEMTRA: 8,
    KETQUATHUCHIEN: 6,
    KIEUCONGVIEC: 5,
    LOAICONGVIEC: 3,
    LOAIHOSO: 2,
    NHOMHOSO: 1,
    PHUONGTHUCKIEMTRA: 9,
    TRANGTHAICONGVIEC: 4
};

const EnumDanhMucMaintenance = {
    DANHMUCKETQUA: "DanhMucKetQua",
    DONVI: "DonVi",
    HINHTHUCKIEMTRA: "HinhThucKiemTra",
    KIEUCONGVIEC: "KieuCongViec",
    LOAICONGVIEC: "LoaiCongViec",
    TRANGTHAICONGVIEC: "TrangThaiCongViec"
};

const EnumMap = {
    BAOTRI_KHUDOTHI: {
        id: 60,
        text: "BAOTRI_KHUDOTHI"
    },
    BAOTRI_NGHIATRANG: {
        id: 62,
        text: "BAOTRI_NGHIATRANG"
    },
    CAPNUOC: {
        id: 39,
        text: "CAPNUOC"
    },
    CAYXANH: {
        id: 1,
        text: "CAYXANH"
    },
    CHIEUSANG: {
        id: 6,
        text: "CHIEUSANG"
    },
    DUNGCHUNG: {
        id: 11,
        text: "DUNGCHUNG"
    },
    GIAOTHONG: {
        id: 45,
        text: "GIAOTHONG"
    },
    KHU_CONGNGHIEP: {
        id: 43,
        text: "KHUCONGNGHIEP"
    },
    KHU_NGHIATRANG: {
        id: 42,
        text: "KHUNGHIATRANG",
    },
    KHUCU_KHUDOTHI: {
        id: 40,
        text: "KHUCUKHUDOTHI"
    },
    PHANHOI_KHACHHANG: {
        id: 61,
        text: "PHANHOI_KHACHHANG"
    },
    THOATNUOC: {
        id: 33,
        text: "THOATNUOC"
    },
    TRUCUUHOA: {
        id: 44,
        text: "TRUCUUHOA"
    },
    TUYNEN: {
        id: 41,
        text: "TUYNEN"
    },
    VITRI_NGAPUNG: {
        id: 34,
        text: "NGAPUNGNGAPLUT"
    },
    VITRI_SUCO: {
        id: 45,
        text: "VITRISUCO"
    }
};

const EnumDanhMucNhomHoSo = {
    CHAMSOCCAYXANH: 3,
    CHAMSOCCHIEUSANG: 6,
    CHAMSOCTUYENCAY: 9,
    CONGVIECSUACHUABAOTRITHOATNUOC: 13,
    HOSO_GOITHAU: 18,
    HOSOHOANCONGGIAOTHONG: 17,
    KIEMTRACAYXANH: 2,
    KIEMTRACHIEUSANG: 5,
    KIEMTRATUYENCAY: 8,
    KIEMTRATUYNEN: 14,
    LICHSUKIEMTRATHOATNUOC: 12,
    SUACHUABAOTRITUYNEN: 15,
    TAILIEUSOCAYXANH: 1,
    TAILIEUSOCHIEUSANG: 4,
    TAILIEUSOGIAOTHONG: 18,
    TAILIEUSOTHOATNUOC: 11,
    TAILIEUSOTUYENCAY: 7,
    TAILIEUSOTUYNEN: 16,
};

const EnumDanhMucLoaiCongViec = {
    BAOTRI_CAPNUOC: 7,
    BAOTRI_NGHIATRANG: 9,
    BAOTRI_TUYNEN: 10,
    BAOTRICHIEUSANG: 5,
    CHAMSOCCHATHACAYXANH: 3,
    KIEMTRA_CAPNUOC: 8,
    KIEMTRACAYXANH: 1,
    KIEMTRACHIEUSANG: 4,
    SUACHUATHOATNUOC: 6,
    TRONGCHAMSOCCAYXANH: 2,
};

const EnumDanhMucLoaiNhanVien = {
    CHAMSOCCAYXANH: 1,
    CHAMSOCCHIEUSANG: 2,
    CHAMSOCTHOATNUOC: 3
};

const EnumDanhMucNhomBanDo = {
    CAPNUOC: {
        id: 51,
        text: "Cấp nước",
    },
    CAYXANH: {
        id: 4,
        text: "Cây xanh"
    },
    CHIEUSANG: {
        id: 5,
        text: "Chiếu sáng",
    },
    DUNG_CHUNG: {
        id: 35,
        text: "Phân hệ dùng chung",
    },
    KHU_CONGNGHIEP: {
        id: 72,
        text: "Khu công nghiệp"
    },
    KHU_NGHIATRANG: {
        id: 68,
        text: "Khu nghĩa trang"
    },
    KHUCU_KHUDOTHI: {
        id: 63,
        text: "Khu đô thị"
    },
    THOATNUOC: {
        id: 44,
        text: "Thoát nước",
    },
    TUYNEN: {
        id: 60,
        text: "Tuy nen/hào kỹ thuật",
    },
};

const EnumReportType = {
    ChieuDaiCongThoatNuoc: {
        id: "ChieuDaiCongThoatNuoc",
        title: "Thống kê chiều dài cống thoát nước"
    },
    ChieuDaiTuyenCap: {
        id: "ChieuDaiTuyenCap",
        title: "Thống kê chiều dài tuyến cáp"
    },
    DuyetHoSoMoiNhat: {
        id: "DuyetHoSoMoiNhat",
        title: "Duyệt danh sách hồ sơ mới nhất theo thời gian"
    },
    SoLuong: {
        id: "SoLuong",
        title: "Thống kê tổng hợp thông tin số lượng theo từng loại nhà và công trình",
    },
    SoLuongBaoTriBaoDuong: {
        id: "SoLuongBaoTriBaoDuong",
        title: "Thống kê tổng hợp số lượng bảo trì bảo dưỡng",
    },
    SoLuongCayXanh: {
        id: "SoLuongCayXanh",
        title: "Thống kê số lượng cây xanh"
    },
    SoLuongCongThoatNuoc: {
        id: "SoLuongCongThoatNuoc",
        title: "Thống kê số lượng cống thoát nước"
    },
    SoLuongHoGa: {
        id: "SoLuongHoGa",
        title: "Thống kê số lượng hố ga"
    },
    SoLuongHoSo: {
        id: "SoLuongHoSo",
        title: "Thống kê số lượng hồ sơ",
    },
    SoLuongSuCo: {
        id: "SoLuongSuCo",
        title: "Thống kê tổng hợp số lượng sự cố"
    },
    ThongKeCayXanhTheoTuyen: {
        id: "ThongKeCayXanhTheoTuyen",
        title: "Thống kê số lượng loại công trình cây xanh theo tuyến"
    },
    ThongKeChieuSangTheoTramDen: {
        id: "ThongKeChieuSangTheoTramDen",
        title: "Thống kê số lượng loại công trình chiếu sáng theo trạm đèn"
    },
    ThongKeChieuSangTheoTuyen: {
        id: "ThongKeChieuSangTheoTuyen",
        title: "Thống kê số lượng loại công trình chiếu sáng theo tuyến"
    },
    ThongKePhanLoaiCongThoatNuoc: {
        id: "ThongKePhanLoaiCongThoatNuoc",
        title: "Thống kê phân loại cống thoát nước"
    },
    ThongKeSoLuong: {
        id: "ThongKeSoLuong",
        title: "Thống kê số lượng công trình"
    },
    ThongKeThoatNuocTheoHo: {
        id: "ThongKeThoatNuocTheoHo",
        title: "Thống kê số lượng loại công trình thoát nước theo hồ"
    },
    ThongKeThoatNuocTheoTuyen: {
        id: "ThongKeThoatNuocTheoTuyen",
        title: "Thống kê số lượng loại công trình thoát nước theo tuyến"
    },
    TinhTrangHoSo: {
        id: "TinhTrangHoSo",
        title: "Thông tin chung tình trạng hồ sơ"
    },
    TongHopThoatNuoc: {
        id: "TongHopThoatNuoc",
        title: "Báo cáo tổng hợp cơ sở dữ liệu mạng lưới thoát nước"
    },
};
const EnumChartType = {
    SoLuong: {
        id: "BieuDoSoLuong",
        title: "Thống kê tổng hợp số lượng theo từng loại nhà và công trình",
    },
    SoLuongBaoTriBaoDuong: {
        id: "BieuDoSoLuongBaoTriBaoDuong",
        title: "Thống kê tổng hợp số lượng bảo trì bảo dưỡng",
    },
    SoLuongHoSo: {
        id: "BieuDoSoLuongHoSo",
        title: "Thống kế số lượng hồ sơ",
    },
    SoLuongSuCo: {
        id: "BieuDoSoLuongSuCo",
        title: "Thống kê tổng hợp số lượng sự cố",
    },
};

const EnumUrbanTransportationReportType = {
    SuCo: {
        id: "SuCo",
        title: "Thống kê tổng hợp sự cố"
    },
};

const EnumUrbanTransportationChartType = {
    BieuDoSuCo: {
        id: "BieuDoSuCo",
        title: "Biểu đồ thống kê sự cố"
    },
};

const EnumThongKePhanLoai = {
    tn_congthoatnuoc: [
        { id: "loaicongid", name_vn: "Loại cống" },
        { id: "duongkinh", name_vn: "Đường kính" },
    ],
    tn_cuaxa: [
        { id: "phanloaiid", name_vn: "Loại cửa xả" },
        { id: "kichthuoccuaxa", name_vn: "Kích thước" },
    ],
    tn_diemdenngapung: [
        { id: "phanloaiid", name_vn: "Loại điểm đen" },
    ],
    tn_hodieuhoa: [
        { id: "loaihoid", name_vn: "Loại hồ" },
    ],
    tn_hoga: [
        { id: "loaiho", name_vn: "Loại hố" },
    ],
    tn_muongsong: [
        { id: "phanloaiid", name_vn: "Loại mương" },
    ],
    tn_muongthoatnuoc: [
        { id: "phanloai", name_vn: "Loại mương" },
    ],
    tn_nhamayxulynuocthai: [
        { id: "phanloaiid", name_vn: "Loại nhà máy" },
    ],
    tn_ranhthoatnuoc: [
        { id: "maplranhtn", name_vn: "Loại rãnh" },
        { id: "duongkinhranhtn", name_vn: "Đường kính" },
    ],
    tn_trambomthoatnuoc: [
        { id: "loaitramid", name_vn: "Loại trạm" },
    ],
    tn_trucuuhoa: [
        { id: "phanloai", name_vn: "Loại trụ" },
        { id: "donviquanly", name_vn: "Đơn vị quản lý" },
    ],
};

const EnumFloodedLocation = {
    HANHCHINH: "hanhchinh",
    PHANLOAI: "phanloai",
    THOIGIAN: "thoigian",
    TINHTRANG: "tinhtrang",
};

export {
    EnumChartType,
    EnumCustom,
    EnumDanhMuc,
    EnumDanhMucLoaiCongViec,
    EnumDanhMucLoaiNhanVien,
    EnumDanhMucMaintenance,
    EnumDanhMucNhomBanDo,
    EnumDanhMucNhomHoSo,
    EnumDataType,
    EnumDefaultStyle,
    EnumFloodedLocation,
    EnumGeometry,
    EnumGetDataType,
    EnumImportFileType,
    EnumMap,
    EnumReportType,
    EnumStatus,
    EnumThongKePhanLoai,
    EnumTypeOf,
    EnumUrbanTransportationChartType,
    EnumUrbanTransportationReportType,
    EnumWebOption,
    EnumsFunction,
    INVALID_TOKEN_ERROR_CODE,
    NO_DATA,
    Operator
};