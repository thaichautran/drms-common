using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("giamsatnhanvien", Schema = "maintenance")]
    public class GiamSatNhanVien
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        [ForeignKey(nameof(nhanVien))]
        public int nhanvien_id { get; set; }
        public DateTime? thoigian_thuchien { get; set; }
        public DateTime? thoigian_ketthuc { get; set; }
        public string? congviecthuchien { get; set; }
        public string? ghichu { get; set; }
        [NotMapped]
        public NhanVien? nhanVien { get; set; }
    }
}