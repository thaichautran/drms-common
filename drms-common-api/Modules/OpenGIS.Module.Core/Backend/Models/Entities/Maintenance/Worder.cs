using Microsoft.AspNetCore.Http;
using OpenGIS.Module.Core.ViewModels;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.InteropServices;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("w_worder", Schema = "maintenance")]
    public class Worder
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int worder_id { get; set; }
        public int? worder_id_org { get; set; }
        public int org_id { get; set; }
        public string? pm_id { get; set; }
        public string? pm_job_id { get; set; }
        public int? pm_counter { get; set; }
        public bool? is_fore_cast { get; set; }
        public bool? is_plan { get; set; }
        public bool? is_exec { get; set; }
        public string? wdesc { get; set; }
        public int? wtype_id { get; set; }
        public int? wstatus_id_fc { get; set; }
        public int? wstatus_id_pl { get; set; }
        public int? wstatus_id_ex { get; set; }
        public int wstatus_id_all { get; set; }
        public int? asset_id { get; set; }
        public string? assetid_owner { get; set; }
        public DateTime? fc_start_date { get; set; }
        public DateTime? fc_finish_date { get; set; }
        public string? fc_note { get; set; }
        public DateTime? actual_start_date { get; set; }
        public DateTime? actual_finish_date { get; set; }
        public string? a_note { get; set; }
        public DateTime? plan_start_date { get; set; }
        public DateTime? plan_finish_date { get; set; }
        public string? p_note { get; set; }
        public string? user_cr_id { get; set; }
        public DateTime? user_cr_dtime { get; set; }
        public string? user_mdf_id { get; set; }
        public DateTime? user_mdf_dtime { get; set; }
        public int? problem_id { get; set; }
        public string? wdesc_more { get; set; }
        public string? a_result_sum { get; set; }
        public int? obj_type_id { get; set; }
        public int? worg_id { get; set; }
        public int? wtype_result_id { get; set; }
        public bool? grid_edit { get; set; }
        public string? wdesc_info { get; set; }
        public int? progress { get; set; }
        public int? wkind_id { get; set; }
        public int? lock_mode { get; set; }
        public string? lock_note { get; set; }
        public DateTime? lock_date { get; set; }
        public int? file_attach_counter { get; set; }
        public int? ord_sign { get; set; }
        public string? list_sign { get; set; }
        public string? province_code { get;set; }
        public string? district_code { get; set; }
        public string? commune_code { get; set; }
        public int? loaicongtrinh_id { get; set; }
        [NotMapped]
        public bool? is_processExist { get; set; }
        [NotMapped]
        public IEnumerable<IFormFile>? maintenanceChatFiles { get; set; }
        [NotMapped]
        public IEnumerable<ThongTinTraoDoiKiemTra>? maintenanceChats { get; set; }
        [NotMapped]
        public IEnumerable<WorderAsset>? worderAssets { get; set; }
        [NotMapped]
        public IEnumerable<ProcessExist>? processExists { get; set; }
        [NotMapped]
        public IEnumerable<GiaoViecNhanVien>? maintenanceWorkers { get; set; }
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