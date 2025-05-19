using Microsoft.AspNetCore.Http;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.IO;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("hosoquanly", Schema = "maintenance")]
    public class HoSoQuanLyKiemTra
    {
        public HoSoQuanLyKiemTra()
        {
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? file_name { get; set; }
        public string? mime_type { get; set; }
        public string? extension { get; set; }
        public int? size { get; set; }
        public string? url { get;set; }
        public int? phieugiamsat_id { get; set; }
        public string? loaikiemtra { get; set; }
        [ForeignKey(nameof(loaiHoSo))]
        public int? loaihoso_id { get; set; }
        [NotMapped]
        public LoaiHoSo? loaiHoSo { get; set; }
        [NotMapped]
        public IFormFile? file { get; set; }
    }
}
