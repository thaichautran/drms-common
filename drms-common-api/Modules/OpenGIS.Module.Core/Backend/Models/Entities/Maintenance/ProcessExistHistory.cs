using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("s_process_exists_his", Schema = "maintenance")]
    public class ProcessExistHistory
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int process_exist_id_his { get; set; }
        public int process_exist_id { get; set; }
        public int obj_id { get; set; }
        public int objtype_id { get; set; }
        public string? asset_id { get; set; }
        public DateTime? date_solution_exist { get; set; }
        public string? solution_exist { get; set; }
        public string? user_id_command { get; set; }
        public string? command_desc { get; set; }
        public DateTime? date_command { get; set; }
        public string? worder_id_exec { get; set; }
        public DateTime? date_plan_exec { get; set; }
        public string? desc_exec { get; set; }
        public DateTime? date_exec { get; set; }
        public string? user_id_exec { get; set; }
        public int? status { get; set; }
        public string? user_cr_id { get; set; }
        public DateTime? user_cr_dtime { get; set; }
        public string? user_mdf_id { get; set; }
        public DateTime? user_mdf_dtime { get; set; }
        public string? his_action { get; set; }
        [NotMapped]
        public IEnumerable<ProblemAsset>? assets { get; set; }
    }
}