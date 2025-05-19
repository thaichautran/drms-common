using Microsoft.AspNetCore.Http;
using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("dutoancongviecsuachua", Schema = "maintenance")]
    public class DuToanCongViecSuaChua
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? madutoan { get; set; }
        public string? tendutoan { get; set; }
        public string? ghichu { get; set; }
        public DateTime? ngaylapdutoan { get; set; }
        public string? nguoilapdutoan { get;set; }
        public int? phieugiamsat_id { get; set; }
        public string? loaikiemtra { get; set; }
        public virtual IEnumerable<DuToanAttachments>? attachments { get; set; }
        [NotMapped]
        public IEnumerable<IFormFile>? files { get; set; }
    }
}
