using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("kehoachkiemtracongtrinh", Schema = "maintenance")]
    public class KeHoachKiemTraCongTrinh
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        [ForeignKey(nameof(keHoachKiemTra))]
        public int? kehoach_id { get; set; }
        [ForeignKey(nameof(table))]
        public int? table_id { get; set; }
        public string? feature_id { get; set; }
        public string? table_name { get; set; }
        public string? feature_name { get; set; }
        public virtual TableInfo? table { get; set; }
        public virtual KeHoachKiemTra? keHoachKiemTra { get; set; }
    }
}