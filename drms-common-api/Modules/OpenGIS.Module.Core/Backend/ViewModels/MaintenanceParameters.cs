using System;
using System.Web;
namespace OpenGIS.Module.Core.Models
{
    public class MaintenanceParameters
    {
        public int? org_id { get; set; }
        public int? worg_id { get; set; }
        public int? obj_type_id { get; set; }
        public int? wtype_id { get; set; }
        public int? wkind_id { get; set; }
        public int? wstatus_id_all { get; set; }
        public string? is_processExist { get; set; }
        public DateTime? start_date { get; set; }
        public DateTime? end_date { get; set; }
        public string? key { get; set; }
        public int? skip { get; set; } = 0;
        public int? take { get; set; } = 10;
        public string? user_id { get; set; }
    }
    public class MaintenanceDataChart
    {
        public string? ma_trangthai { get; set; }
        public string? trang_thai { get; set; }
        public int? so_luong { get; set; }
    }
}
