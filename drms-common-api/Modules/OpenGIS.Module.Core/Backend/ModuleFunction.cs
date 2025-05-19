using Microsoft.AspNetCore.Authorization;
using VietGIS.Infrastructure.Policies.Requirements;

namespace OpenGIS.Module.Core
{
    public class ModuleFunction : VietGIS.Infrastructure.Modules.IModuleFunction
    {
        public static IAuthorizationRequirement READ_USERS = new ReadPermission("core.users.read", "Quản lý người dùng") { group = "Hệ thống" };
        public static IAuthorizationRequirement EDIT_USERS = new EditPermission("core.users.edit", "Chỉnh sửa thông tin người dùng") { group = "Hệ thống" };
        public static IAuthorizationRequirement DELETE_USERS = new DeletePermission("core.users.delete", "Xoá người dùng") { group = "Hệ thống" };
        public static IAuthorizationRequirement CAYXANH_DULIEU = new ReadPermission("cay-xanh.func.data", "Chức năng quản lý dữ liệu") { group = "Cây xanh" };
        public static IAuthorizationRequirement CAYXANH_BAOCAO = new ReadPermission("cay-xanh.func.report", "Chức năng báo cáo") { group = "Cây xanh" };
        public static IAuthorizationRequirement CAYXANH_HOSO = new ReadPermission("cay-xanh.func.hoso", "Chức năng hồ sơ") { group = "Cây xanh" };
        public static IAuthorizationRequirement CAYXANH_VANHANH = new ReadPermission("cay-xanh.func.vanhanh", "Chức năng vận hành") { group = "Cây xanh" };
        public static IAuthorizationRequirement CAYXANH_NHANVIEN_CHAMSOC = new ReadPermission("cay-xanh.func.nhanvienchamsoc", "Chức năng quản lý nhân viên chăm sóc") { group = "Cây xanh" };
        public static IAuthorizationRequirement CAYXANH_CHAMSOC = new ReadPermission("cay-xanh.func.nhanvienchamsoc", "Chức năng chăm sóc") { group = "Cây xanh" };

        public static IAuthorizationRequirement CHIEUSANG_DULIEU = new ReadPermission("chieu-sang.func.data", "Chức năng quản lý dữ liệu") { group = "Chiếu sáng" };
        public static IAuthorizationRequirement CHIEUSANG_BAOCAO = new ReadPermission("chieu-sang.func.report", "Chức năng báo cáo") { group = "CHiếu sansg" };
        public static IAuthorizationRequirement CHIEUSANG_BAOTRI = new ReadPermission("chieu-sang.func.baotri", "Chức năng sửa chữa, bảo trì") { group = "" };
        public static IAuthorizationRequirement CHIEUSANG_VANHANH = new ReadPermission("chieu-sang.func.vanhanh", "Chức năng giám sát, vận hành") { group = "" };
        public static IAuthorizationRequirement CHIEUSANG_TAISAN = new ReadPermission("chieu-sang.func.taisan", "Chức năng bản đồ tình trạng tài sản mạng chiếu sáng") { group = "" };
        public static IAuthorizationRequirement CHIEUSANG_NHANVIEN_CHAMSOC = new ReadPermission("chieu-sang.func.nhanvienchamsoc", "Chức năng quản lý nhân viên sửa chữa, bảo trì ") { group = "" };
        public static IAuthorizationRequirement THOATNUOC_BAOCAO = new ReadPermission("thoat-nuoc.func.report", "Chức năng báo cáo") { group = "" };
        public static IAuthorizationRequirement THOATNUOC_DULIEU = new ReadPermission("thoat-nuoc.func.data", "Chức năng quản lý dữ liệu") { group = "" };
        public static IAuthorizationRequirement THOATNUOC_HOSO = new ReadPermission("thoat-nuoc.func.hoso", "Chức năng quản lý dữ liệu") { group = "" };
        public static IAuthorizationRequirement THOATNUOC_VANHANH = new ReadPermission("thoat-nuoc.func.vanhanh", "Chức năng kiểm tra vận hành") { group = "" };
        public static IAuthorizationRequirement THOATNUOC_NAOVET = new ReadPermission("thoat-nuoc.func.naovet", "Chức năng quản lý nạo vét hệ thống thoát nước") { group = "" };
        public static IAuthorizationRequirement THOATNUOC_NGAPUNG = new ReadPermission("thoat-nuoc.func.ngapung", "Chức năng quản lý vị trí vùng ngập úng/ngập lụt") { group = "" };
        public static IAuthorizationRequirement THOATNUOC_NHANVIEN_CHAMSOC = new ReadPermission("thoat-nuoc.func.nhanvienchamsoc", "Chức năng QL nhân viên sửa chữa, bảo trì ") { group = "" };
        public static IAuthorizationRequirement TUYNEN_DULIEU = new ReadPermission("tuy-nen.func.data", "Chức năng quản lý dữ liệu") { group = "" };
        public static IAuthorizationRequirement TUYNEN_BAOTRI = new ReadPermission("tuy-nen.func.baotri", "Chức năng bảo trì") { group = "" };
        public static IAuthorizationRequirement TUYNEN_HOSO = new ReadPermission("tuy-nen.func.hoso", "Chức năng hồ sơ") { group = "" };
        public static IAuthorizationRequirement TUYNEN_VANHANH = new ReadPermission("tuy-nen.func.vanhanh", "Chức năng vận hành") { group = "" };
        public static IAuthorizationRequirement CONGNGHIEP_DULIEU = new ReadPermission("khu-cong-nghiep.func.data", "Chức năng quản lý dữ liệu") { group = "" };
        public static IAuthorizationRequirement CONGNGHIEP_VANHANH = new ReadPermission("khu-cong-nghiep.func.vanhanh", "Chức năng vận hành") { group = "" };
        public static IAuthorizationRequirement CONGNGHIEP_BAOCAO = new ReadPermission("khu-cong-nghiep.func.baocao", "Chức năng báo cáo") { group = "" };
        public static IAuthorizationRequirement CONGNGHIEP_BIEUMAU = new ReadPermission("khu-cong-nghiep.func.bieumau", "Chức năng biểu mẫu") { group = "" };
    }
}

