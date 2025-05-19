using Microsoft.AspNetCore.Http;
using OpenGIS.Module.Core.Models.Entities.Category;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.IO;
using System.Text;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;

namespace OpenGIS.Module.Core.Models.Entities.QLHS
{
    [Table("hethong_tichhop", Schema = "public")]
    public class HeThongTichHop
    {
        public HeThongTichHop()
        {
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? mo_ta { get; set; }
        public string? url { get; set; }
        public DateTime? created_at { get; set; }
        public DateTime? updated_at { get; set; }
        public virtual IList<ThoiGian>? listThoiGian { get; set; }
        [NotMapped]
        public bool is_integrated { get; set; }
        [Table("hethong_tichhop_thoigian", Schema = "public")]
        public sealed class ThoiGian
        {
            [Key]
            [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
            public int id { get; set; }
            [ForeignKey(nameof(heThong))]
            public int hethong_id { get; set; }
            public HeThongTichHop? heThong { set; get; }
            [ForeignKey(nameof(schema))]
            public string? schema_name { set; get; }
            public TableSchema? schema { set; get; }
            [ForeignKey(nameof(layer))]
            public int layer_id { set; get; }
            public Layer? layer { set; get; }
            public string? thoigian_thietlap { set; get; }
        }
    }
}
