using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("w_worder_assets", Schema = "maintenance")]
    public class WorderAsset
    {
        [Key]
        public int worder_id { get; set; }
        [Key]
        public int asset_id { get; set; }
        public int layer_id { get; set; }
        public string? layer_name { get; set; }
        public string? user_cr_id { get; set; }
        public DateTime? user_cr_dtime { get; set; }
        public string? user_mdf_id { get; set; }
        public DateTime? user_mdf_dtime { get; set; }
        public string? asset_name { get; set; }
        [NotMapped]
        public Worder? worder { get; set; }
    }
}