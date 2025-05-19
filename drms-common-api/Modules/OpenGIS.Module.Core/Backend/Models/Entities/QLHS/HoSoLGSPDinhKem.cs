using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.IO;
using Microsoft.AspNetCore.Http;

namespace OpenGIS.Module.Core.Models.Entities.QLHS
{
    [Table("hoso_lgsp_dinhkem", Schema = "qlhs")]
    public class HoSoLGSPDinhKem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        [ForeignKey(nameof(ho_so))]
        public int hoso_id { get; set; }
        public virtual HoSoLGSP? ho_so { set; get; }
        public string? file_name { set; get; }
        public string? store_file_name { set; get; }
        public int size { set; get; }
        public string? mime_type { set; get; }
        public string? url { set; get; }
        [NotMapped]
        public string extension
        {
            get
            {
                var exs = Path.GetExtension(file_name);
                return exs.ToLower();
            }
        }
    }
}