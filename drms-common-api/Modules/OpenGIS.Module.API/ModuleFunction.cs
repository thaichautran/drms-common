using Microsoft.AspNetCore.Authorization;
using VietGIS.Infrastructure.Policies.Requirements;

namespace OpenGIS.Module.API
{
    public class ModuleFunction : VietGIS.Infrastructure.Modules.IModuleFunction
    {
        public static IAuthorizationRequirement _APPROVE = new ApprovePermission("api.base", "Xác minh");

        public static IAuthorizationRequirement READ_BASE_LAYER = new ReadPermission("api.base_layer.read", "Quản lý lớp bản đồ") { group = "Lớp bản đồ" };
        public static IAuthorizationRequirement EDIT_BASE_LAYER = new EditPermission("api.base_layer.edit", "Chỉnh sửa lớp bản đồ") { group = "Lớp bản đồ" };
        public static IAuthorizationRequirement DELETE_BASE_LAYER = new DeletePermission("api.base_layer.delete", "Xoá lớp bản đồ") { group = "Lớp bản đồ" };

        public static IAuthorizationRequirement READ_BOOKMARK = new ReadPermission("api.bookmark.read", "Quản lý bookmark") { group = "Bookmark" };
        public static IAuthorizationRequirement EDIT_BOOKMARK = new EditPermission("api.bookmark.edit", "Chỉnh sửa bookmark") { group = "Bookmark" };
        public static IAuthorizationRequirement DELETE_BOOKMARK = new DeletePermission("api.bookmark.delete", "Xoá bookmark") { group = "Bookmark" };

        public static IAuthorizationRequirement READ_CATEGORY = new ReadPermission("api.category.read", "Quản lý danh mục") { group = "Danh mục" };
        public static IAuthorizationRequirement EDIT_CATEGORY = new EditPermission("api.category.edit", "Chỉnh sửa danh mục") { group = "Danh mục" };
        public static IAuthorizationRequirement DELETE_CATEGORY = new DeletePermission("api.category.delete", "Xoá danh mục") { group = "Danh mục" };

        public static IAuthorizationRequirement READ_FAQ = new ReadPermission("api.faq.read", "Quản lý Câu hỏi thường gặp") { group = "Hệ thống" };
        public static IAuthorizationRequirement EDIT_FAQ = new EditPermission("api.faq.edit", "Chỉnh sửa câu hỏi thường gặp") { group = "Hệ thống" };
        public static IAuthorizationRequirement DELETE_FAQ = new DeletePermission("api.faq.delete", "Xoá câu hỏi thường gặp") { group = "Hệ thống" };

        public static IAuthorizationRequirement READ_FEATURE = new ReadPermission("api.feature.read", "Quản lý đối tượng") { group = "Đối tượng" };
        public static IAuthorizationRequirement EDIT_FEATURE = new EditPermission("api.feature.edit", "Chỉnh sửa câu hỏi thường gặp") { group = "Hệ thống" };
        public static IAuthorizationRequirement DELETE_FEATURE = new DeletePermission("api.feature.delete", "Xoá câu hỏi thường gặp") { group = "Hệ thống" };

        public static IAuthorizationRequirement READ_GROUPS = new ReadPermission("api.groups.read", "Quản lý nhóm người dùng") { group = "Hệ thống" };
        public static IAuthorizationRequirement EDIT_GROUPS = new EditPermission("api.groups.edit", "Chỉnh sửa nhóm người dùng") { group = "Hệ thống" };
        public static IAuthorizationRequirement DELETE_GROUPS = new DeletePermission("api.groups.delete", "Xoá nhóm người dùng") { group = "Hệ thống" };

        public static IAuthorizationRequirement READ_HOME_ITEM = new ReadPermission("api.home_item.read", "Quản lý module hệ thống") { group = "Module hệ thống" };
        public static IAuthorizationRequirement EDIT_HOME_ITEM = new EditPermission("api.home_item.edit", "Chỉnh sửa module hệ thống") { group = "Module hệ thống" };
        public static IAuthorizationRequirement DELETE_HOME_ITEM = new DeletePermission("api.home_item.delete", "Xoá module hệ thống") { group = "Module hệ thống" };

        public static IAuthorizationRequirement READ_LAYER = new ReadPermission("api.layer.read", "Quản lý lớp dữ liệu") { group = "Lớp dữ liệu" };
        public static IAuthorizationRequirement EDIT_LAYER = new EditPermission("api.layer.edit", "Chỉnh sửa lớp dữ liệu") { group = "Lớp dữ liệu" };
        public static IAuthorizationRequirement DELETE_LAYER = new DeletePermission("api.layer.delete", "Xoá lớp dữ liệu") { group = "Lớp dữ liệu" };

        public static IAuthorizationRequirement READ_LAYER_GROUP = new ReadPermission("api.layer_group.read", "Quản lý nhóm lớp dữ liệu") { group = "Nhóm lớp dữ liệu" };
        public static IAuthorizationRequirement EDIT_LAYER_GROUP = new EditPermission("api.layer_group.edit", "Chỉnh sửa nhóm lớp dữ liệu") { group = "Nhóm lớp dữ liệu" };
        public static IAuthorizationRequirement DELETE_LAYER_GROUP = new DeletePermission("api.layer_group.delete", "Xoá nhóm lớp dữ liệu") { group = "Nhóm lớp dữ liệu" };

        public static IAuthorizationRequirement READ_MAINTENANCE = new ReadPermission("api.maintenance.read", "Quản lý công việc kiểm tra") { group = "Công việc kiểm tra" };
        public static IAuthorizationRequirement EDIT_MAINTENANCE = new EditPermission("api.maintenance.edit", "Chỉnh sửa công việc kiểm tra") { group = "Công việc kiểm tra" };
        public static IAuthorizationRequirement DELETE_MAINTENANCE = new DeletePermission("api.maintenance.delete", "Xoá công việc kiểm tra") { group = "Công việc kiểm tra" };

        public static IAuthorizationRequirement READ_WORKER = new ReadPermission("api.worker.read", "Quản lý nhân viên") { group = "Nhân viên" };
        public static IAuthorizationRequirement EDIT_WORKER = new EditPermission("api.worker.edit", "Chỉnh sửa nhân viên") { group = "Nhân viên" };
        public static IAuthorizationRequirement DELETE_WORKER = new DeletePermission("api.worker.delete", "Xoá nhân viên") { group = "Nhân viên" };

        public static IAuthorizationRequirement READ_PROBLEM = new ReadPermission("api.problem.read", "Quản lý sự cố") { group = "Sự cố" };
        public static IAuthorizationRequirement EDIT_PROBLEM = new EditPermission("api.problem.edit", "Chỉnh sửa sự cố") { group = "Sự cố" };
        public static IAuthorizationRequirement DELETE_PROBLEM = new DeletePermission("api.problem.delete", "Xoá sự cố") { group = "Sự cố" };

        public static IAuthorizationRequirement READ_MAP = new ReadPermission("api.map.read", "Quản lý bản đồ") { group = "Bản đồ" };
        public static IAuthorizationRequirement EDIT_MAP = new EditPermission("api.map.edit", "Chỉnh sửa bản đồ") { group = "Bản đồ" };
        public static IAuthorizationRequirement DELETE_MAP = new DeletePermission("api.map.delete", "Xoá bản đồ") { group = "Bản đồ" };

        public static IAuthorizationRequirement READ_REGION = new ReadPermission("api.map.read", "Quản lý đơn vị hành chính") { group = "Đơn vị hành chính" };

        public static IAuthorizationRequirement READ_SYNC = new ReadPermission("api.sync.read", "Quản lý đồng bộ dữ liệu") { group = "Đồng bộ dữ liệu" };

        public static IAuthorizationRequirement READ_TABLE = new ReadPermission("api.table.read", "Quản lý bảng dữ liệu") { group = "Bảng dữ liệu" };
        public static IAuthorizationRequirement EDIT_TABLE = new EditPermission("api.table.edit", "Chỉnh sửa bảng dữ liệu") { group = "Bảng dữ liệu" };
        public static IAuthorizationRequirement DELETE_TABLE = new DeletePermission("api.table.delete", "Xoá bảng dữ liệu") { group = "Bảng dữ liệu" };

        public static IAuthorizationRequirement READ_TABLE_COLUMN = new ReadPermission("api.table_column.read", "Quản lý trường dữ liệu") { group = "Trường dữ liệu" };
        public static IAuthorizationRequirement EDIT_TABLE_COLUMN = new EditPermission("api.table_column.edit", "Chỉnh sửa trường dữ liệu") { group = "Trường dữ liệu" };
        public static IAuthorizationRequirement DELETE_TABLE_COLUMN = new DeletePermission("api.table_column.delete", "Xoá trường dữ liệu") { group = "Trường dữ liệu" };

        public static IAuthorizationRequirement READ_TABLE_RELATION = new ReadPermission("api.table_relation.read", "Quản lý bảng dữ liệu quan hệ") { group = "Bảng dữ liệu quan hệ" };
        public static IAuthorizationRequirement EDIT_TABLE_RELATION = new EditPermission("api.table_relation.edit", "Chỉnh sửa bảng dữ liệu quan hệ") { group = "Bảng dữ liệu quan hệ" };
        public static IAuthorizationRequirement DELETE_TABLE_RELATION = new DeletePermission("api.table_relation.delete", "Xoá bảng dữ liệu quan hệ") { group = "Bảng dữ liệu quan hệ" };

        public static IAuthorizationRequirement READ_TABLE_SCHEMA = new ReadPermission("api.table_schema.read", "Quản lý schema") { group = "Schema" };
        public static IAuthorizationRequirement EDIT_TABLE_SCHEMA = new EditPermission("api.table_schema.edit", "Chỉnh sửa schema") { group = "Schema" };
        public static IAuthorizationRequirement DELETE_TABLE_SCHEMA = new DeletePermission("api.table_schema.delete", "Xoá schema") { group = "Schema" };

        public static IAuthorizationRequirement READ_TOKEN = new ReadPermission("api.token.read", "Quản lý token") { group = "Token" };

        public static IAuthorizationRequirement READ_AUDIT_LOG = new ReadPermission("core.audit_log.read", "Quản lý lịch sử truy cập") { group = "Hệ thống" };
        // public static IAuthorizationRequirement EDIT_AUDIT_LOG = new ReadPermission("core.audit_log", "Lịch sử truy cập");
        // public static IAuthorizationRequirement DELETE_AUDIT_LOG = new ReadPermission("core.audit_log", "Lịch sử truy cập");

        public static IAuthorizationRequirement READ_ACCESS_LOG = new ReadPermission("core.access_log.read", "Quản lý lịch sử thao tác") { group = "Hệ thống" };
        // public static IAuthorizationRequirement EDIT_ACCESS_LOG = new ReadPermission("core.access_log", "Lịch sử thao tác");
        // public static IAuthorizationRequirement DELETE_ACCESS_LOG = new ReadPermission("core.access_log", "Lịch sử thao tác");

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
        public static IAuthorizationRequirement THOATNUOC_VANHANH = new ReadPermission("thoat-nuoc.func.vanhanh", "Chức năng kiểm tra vận hành") { group = "" };
        public static IAuthorizationRequirement THOATNUOC_NAOVET = new ReadPermission("thoat-nuoc.func.naovet", "Chức năng quản lý nạo vét hệ thống thoát nước") { group = "" };
        public static IAuthorizationRequirement THOATNUOC_NGAPUNG = new ReadPermission("thoat-nuoc.func.ngapung", "Chức năng quản lý vị trí vùng ngập úng/ngập lụt") { group = "" };
        public static IAuthorizationRequirement THOATNUOC_NHANVIEN_CHAMSOC = new ReadPermission("thoat-nuoc.func.nhanvienchamsoc", "Chức năng QL nhân viên sửa chữa, bảo trì ") { group = "" };
        // public static IAuthorizationRequirement CAPNUOC_BAOTRI = new ReadPermission("cap-nuoc.func.baotri", "Chức năng sửa chữa, bảo trì") { group = "" };
        // public static IAuthorizationRequirement CAPNUOC_DULIEU = new ReadPermission("cap-nuoc.func.data", "Chức năng quản lý dữ liệu") { group = "" };
        // public static IAuthorizationRequirement CAPNUOC_HOSO = new ReadPermission("cap-nuoc.func.hoso", "Chức năng hồ sơ") { group = "" };
        // public static IAuthorizationRequirement CAPNUOC_VANHANH = new ReadPermission("cap-nuoc.func.vanhanh", "Chức năng kiểm tra vận hành") { group = "" };
        // public static IAuthorizationRequirement CAPNUOC_NHANVIEN_CHAMSOC = new ReadPermission("cap-nuoc.func.nhanvienchamsoc", "Chức năng QL nhân viên sửa chữa, bảo trì ") { group = "" };
        public static IAuthorizationRequirement TUYNEN_DATA = new ReadPermission("tuy-nen.func.data", "Chức năng quản lý dữ liệu") { group = "" };
        public static IAuthorizationRequirement TUYNEN_BAOTRI = new ReadPermission("tuy-nen.func.baotri", "Chức năng bảo trì") { group = "" };
        public static IAuthorizationRequirement TUYNEN_HOSO = new ReadPermission("tuy-nen.func.hoso", "Chức năng hồ sơ") { group = "" };
        // public static IAuthorizationRequirement NGHIATRANG_DULIEU = new ReadPermission("khu-nghia-trang.func.data", "Chức năng quản lý dữ liệu") { group = "" };
        // public static IAuthorizationRequirement NGHIATRANG_VANHANH = new ReadPermission("khu-nghia-trang.func.vanhanh", "Chức năng kiểm tra vận hành") { group = "" };
        // public static IAuthorizationRequirement NGHIATRANG_BAOCAO = new ReadPermission("khu-nghia-trang.func.baocao", "Chức năng quản lý báo cáo") { group = "" };
        // public static IAuthorizationRequirement NGHIATRANG_BAOTRI = new ReadPermission("khu-nghia-trang.func.baotri", "Chức năng quản lý bảo trì") { group = "" };
        public static IAuthorizationRequirement CONGNGHIEP_DULIEU = new ReadPermission("khu-cong-nghiep.func.data", "Chức năng quản lý dữ liệu") { group = "" };
        public static IAuthorizationRequirement CONGNGHIEP_VANHANH = new ReadPermission("khu-cong-nghiep.func.vanhanh", "Chức năng vận hành") { group = "" };
        public static IAuthorizationRequirement CONGNGHIEP_BAOCAO = new ReadPermission("khu-cong-nghiep.func.baocao", "Chức năng báo cáo") { group = "" };
        // public static IAuthorizationRequirement DOTHI_DULIEU = new ReadPermission("khu-do-thi.func.data", "Chức năng quản lý dữ liệu") { group = "" };
        // public static IAuthorizationRequirement DOTHI_BAOCAO = new ReadPermission("khu-do-thi.func.baocao", "Chức năng báo cáo") { group = "" };
        // public static IAuthorizationRequirement DOTHI_VANHANH = new ReadPermission("khu-do-thi.func.vanhanh", "Chức năng vận hành") { group = "" };

    }
}

