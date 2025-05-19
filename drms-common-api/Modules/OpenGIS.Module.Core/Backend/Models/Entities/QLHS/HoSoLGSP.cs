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
    [Table("hoso_lgsp", Schema = "qlhs")]
    public class HoSoLGSP
    {
        public HoSoLGSP()
        {
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public int? bussiness { get; set; }
        public string? bussiness_doc_reason { get; set; }
        public string? response_for { get; set; }
        public string? organ_id { get; set; }
        public string? document_id { get; set; }
        public string? code { get; set; }
        public DateTime? promulgation_date { get; set; }
        public DateTime? created_at { get; set; }
        public virtual IEnumerable<HoSoLGSPDinhKem>? attachments { get; set; }
        [NotMapped]
        public IEnumerable<IFormFile>? files { get; set; }
    }
}
