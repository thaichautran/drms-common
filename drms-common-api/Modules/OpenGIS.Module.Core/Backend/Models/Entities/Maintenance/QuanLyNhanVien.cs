using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("quanlynhanvien", Schema = "maintenance")]
    public class NhanVien
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? tennhanvien { get; set; }
        public string? diachi { get; set; }
        public string? sodienthoai { get; set; }
        public string? chucvu { get; set; }
        public string? email { get; set; }
        public string? donvicongtac { get; set; }
        public int? loainhanvien_id { get; set; }
    }
}