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

namespace OpenGIS.Module.Core.Models.Entities.QLHS
{
    [Table("dm_baocao", Schema = "public")]
    public class BaoCao
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? mo_ta { get; set; }
        [ForeignKey(nameof(tableSchema))]
        public string? schema_name { get; set; }
        public virtual TableSchema? tableSchema { get; set; }
        public string? export_data_path { get; set; }
        public string? export_excel_path { get; set; }
        public string? page_sizes { get; set; }
        public int order { get; set; }
        public virtual IEnumerable<DuLieuTimKiem>? filterFields { get; set; }
        [Table("baocao_dulieu_timkiem", Schema = "public")]
        public sealed class DuLieuTimKiem
        {
            [Key]
            [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
            public int id { get; set; }
            [ForeignKey(nameof(baoCao))]
            public int baocao_id { get; set; }
            public BaoCao? baoCao { set; get; }
            public string? table_name { set; get; }
            public string? column_name { set; get; }
            public string? name_vn { set; get; }
            public bool? is_required { set; get; }
            [NotMapped]
            public TableInfo? table { get; set; }
        }
    }
}
