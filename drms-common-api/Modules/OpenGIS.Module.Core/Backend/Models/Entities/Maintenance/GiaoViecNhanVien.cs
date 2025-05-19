using OpenGIS.Module.Core.Models.Entities.Maintenance;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("giaoviecnhanvien", Schema = "maintenance")]
    public class GiaoViecNhanVien
    {
        [Key]
        public int? phieugiamsat_id { get; set; }
        [Key]
        [ForeignKey(nameof(nhanVien))]
        public int? nhanvien_id { get; set; }
        public string? ghichu { get; set; }
        public string? loaikiemtra { get; set; }
        [NotMapped]
        public virtual NhanVien? nhanVien { get; set; }
    }
}