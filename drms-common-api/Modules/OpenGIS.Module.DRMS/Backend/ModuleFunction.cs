using Microsoft.AspNetCore.Authorization;
using VietGIS.Infrastructure.Policies.Requirements;

namespace OpenGIS.Module.DRMS
{
    public class ModuleFunction : VietGIS.Infrastructure.Modules.IModuleFunction
    {
        public static IAuthorizationRequirement KICHBAN_READ = new EditPermission("kich-ban.func.read", "Quản lý thông tin danh sách khu");
        public static IAuthorizationRequirement KICHBAN_CREATE = new EditPermission("kich-ban.func.add", "Thêm mới thông tin khu");
        public static IAuthorizationRequirement KICHBAN_EDIT = new EditPermission("kich-ban.func.update", "Chỉnh sửa thông tin khu");
        public static IAuthorizationRequirement KICHBAN_DELETE = new DeletePermission("kich-ban.func.delete", "Xoá thông tin khu");

        public static IAuthorizationRequirement BANDO_READ = new EditPermission("ban-do.func.read", "Quản lý thông tin danh sách khu");
        public static IAuthorizationRequirement BANDO_CREATE = new EditPermission("ban-do.func.add", "Thêm mới thông tin khu");
        public static IAuthorizationRequirement BANDO_EDIT = new EditPermission("ban-do.func.update", "Chỉnh sửa thông tin khu");
        public static IAuthorizationRequirement BANDO_DELETE = new DeletePermission("ban-do.func.delete", "Xoá thông tin khu");

        public static IAuthorizationRequirement TAILIEU_READ = new EditPermission("tai-lieu.func.read", "Quản lý thông tin danh sách khu");
        public static IAuthorizationRequirement TAILIEU_CREATE = new EditPermission("tai-lieu.func.add", "Thêm mới thông tin khu");
        public static IAuthorizationRequirement TAILIEU_EDIT = new EditPermission("tai-lieu.func.update", "Chỉnh sửa thông tin khu");
        public static IAuthorizationRequirement TAILIEU_DELETE = new DeletePermission("tai-lieu.func.delete", "Xoá thông tin khu");

        public static IAuthorizationRequirement HUONGDANSUDUNG_READ = new EditPermission("huongdan-sudung.func.read", "Quản lý thông tin danh sách khu");
        public static IAuthorizationRequirement HUONGDANSUDUNG_CREATE = new EditPermission("huongdan-sudung.func.add", "Thêm mới thông tin khu");
        public static IAuthorizationRequirement HUONGDANSUDUNG_EDIT = new EditPermission("huongdan-sudung.func.update", "Chỉnh sửa thông tin khu");
        public static IAuthorizationRequirement HUONGDANSUDUNG_DELETE = new DeletePermission("huongdan-sudung.func.delete", "Xoá thông tin khu");


    }
}

