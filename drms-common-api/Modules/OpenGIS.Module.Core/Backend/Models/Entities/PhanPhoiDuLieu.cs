using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VietGIS.Infrastructure.Models.Database.Map;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("phanphoi_dulieu", Schema = "public")]
    public class PhanPhoiDuLieu
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        [ForeignKey(nameof(layer))]
        public int layer_id { get; set; }
        public virtual Layer? layer { get; set; }
        public int data_count { get; set; }
        public bool is_integrated { get; set; }
        public DateTime? sync_date { get; set; }
        public string? ip_address { get; set; }
        public string? database_name { get; set; }
    }
}