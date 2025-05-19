using Microsoft.AspNetCore.Http;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpenGIS.Module.Core.ViewModels
{
    public class WorderInfoViewModel
    {
        public int worder_id { get; set; }
        public int org_id { get; set; }
        public string? org_name { get; set; }
        public string? wdesc { get; set; }
        public int? wtype_id { get; set; }
        public string? wtype_name { get; set; }
        public int? wstatus_id_all { get; set; }
        public string? wstatus_all { get; set; }
        public int? asset_id { get; set; }
        public string? assetid_owner { get; set; }
        public DateTime? fc_start_date { get; set; }
        public DateTime? fc_finish_date { get; set; }
        public DateTime? actual_start_date { get; set; }
        public DateTime? actual_finish_date { get; set; }
        public DateTime? plan_start_date { get; set; }
        public DateTime? plan_finish_date { get; set; }
        public string? user_cr_id { get; set; }
        public DateTime? user_cr_dtime { get; set; }
        public string? user_mdf_id { get; set; }
        public DateTime? user_mdf_dtime { get; set; }
        public string? wdesc_more { get; set; }
        public string? a_result_sum { get; set; }
        public int? obj_type_id { get; set; }
        public string? obj_type_name { get; set; }
        public int? worg_id { get; set; }
        public string? worg_name { get; set; }
        public int? wtype_result_id { get; set; }
        public string? wtype_result_name { get; set; }
        public string? wdesc_info { get; set; }
        public int? wkind_id { get; set; }
        public string? wkind_name { get; set; }
        public int loaicongtrinh_id { get; set; }
        public string? loaicongtrinh_name { get; set; }
        public string? district_code { get; set; }
        public string? dis_name { get; set; }
        public string? commune_code { get; set; }
        public string? com_name { get;set; }
        [NotMapped]
        public bool? is_processExist { get; set; }
        [NotMapped]
        public IEnumerable<IFormFile>? maintenanceChatFiles { get; set; }
        [NotMapped]
        public IEnumerable<ThongTinTraoDoiKiemTra>? maintenanceChats { get; set; }
        [NotMapped]
        public IEnumerable<WorderAsset>? worderAssets { get; set; }
        [NotMapped]
        public IEnumerable<MaintenanceWorker>? maintenanceWorkers { get; set; }
        [NotMapped]
        public IEnumerable<ProcessExist>? processExists { get; set; }
        [NotMapped]
        public IEnumerable<ProcessExist>? deleteProcessExists { get; set; }
        [NotMapped]
        public IEnumerable<MaintenanceFile>? maintenanceFiles { get; set; }
        [NotMapped]
        public string? deleteMaintenanceFileIds { get; set; }
        [NotMapped]
        public IEnumerable<WorderAssetViewModel>? worderAssetViews { get; set; }
    }
}
