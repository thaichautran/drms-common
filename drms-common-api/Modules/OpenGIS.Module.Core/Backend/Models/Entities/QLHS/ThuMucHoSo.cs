using Microsoft.AspNetCore.Http;
using OpenGIS.Module.Core.Models.Entities.Category;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.IO;
using System.Text;
using VietGIS.Infrastructure;

namespace OpenGIS.Module.Core.Models.Entities.QLHS
{
    [Table("thumuc_hoso", Schema = "qlhs")]
    public class ThuMucHoSo
    {
        public ThuMucHoSo()
        {
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? mo_ta { get; set; }
        public DateTime? created_at { get; set; }
        public DateTime? updated_at { get; set; }
        public virtual IList<DinhKem>? listDinhKem { get; set; }
        [Table("thumuc_dinhkem", Schema = "qlhs")]
        public sealed class DinhKem
        {
            [Key]
            [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
            public int id { get; set; }
            [ForeignKey(nameof(thuMuc))]
            public int thumuc_id { get; set; }
            public ThuMucHoSo? thuMuc { set; get; }
            public string? file_name { set; get; }
            public string? store_file_name { set; get; }
            public int size { set; get; }
            public string? mime_type { set; get; }
            public string? url { set; get; }
            [NotMapped]
            public string? extension
            {
                get
                {
                    if (!string.IsNullOrEmpty(file_name))
                    {
                        return Path.GetExtension(file_name).ToLower();
                    }
                    return string.Empty;
                }
            }
        }
    }
}
