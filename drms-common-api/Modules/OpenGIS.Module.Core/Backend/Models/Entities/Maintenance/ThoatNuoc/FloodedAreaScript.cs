using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.IO;
using Microsoft.AspNetCore.Http;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Models.Regional;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance.ThoatNuoc
{
    [Table("tn_kichbanngapung", Schema = "csdl_thoatnuoc")]
    public class FloodedAreaScript
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? ten_kichban { get; set; }
        public DateTime? ngay_tao { get; set; }
        public double luong_mua { get; set; }
        [ForeignKey(nameof(commune))]
        public string? commune_code { get; set; }
        [ForeignKey(nameof(district))]
        public string? district_code { get; set; }
        [ForeignKey(nameof(province))]
        public string? province_code { get; set; }
        [NotMapped]
        public Commune? commune { get; set; }
        [NotMapped]
        public District? district { get; set; }
        [NotMapped]
        public Province? province { get; set; }
        [NotMapped]
        public IEnumerable<FloodedAreaScriptAttachment>? attachments { get; set; }
        [NotMapped]
        public IEnumerable<FileView>? files { get; set; }

        [NotMapped]
        public string? geom { get; set; }
    }

    public class FileView
    {
        public string FileName { get; set; }
        public string url { get; set; }
        public string ContentType { get; set; }
    }
}