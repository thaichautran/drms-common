using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("chamcong", Schema = "maintenance")]
    public class ChamCong
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        [ForeignKey(nameof(nhanVien))]
        public int nhanvien_id { get; set; }
        public DateTime? ngay { get; set; }
        public bool? chamcong { get; set; }
        public string? lydonghi { get; set; }
        public string? ghichu { get; set; }
        public bool? nghicophep { get; set; }
        [NotMapped]
        public NhanVien? nhanVien { get; set; }
        [NotMapped]
        public string? year => $"{ngay?.ToString("yyyy")}";
        [NotMapped]
        public string? month => $"{ngay?.ToString("MM")}";
        [NotMapped]
        public string? day => $"{ngay?.ToString("dd")}";
    }
}