using OpenGIS.Module.Core.Models.Entities.Maintenance;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("kehoachkiemtranhanvien", Schema = "maintenance")]
    public class KeHoachKiemTraNhanVien
    {
        [Key]
        [ForeignKey(nameof(keHoachKiemTra))]
        public int? kehoach_id { get; set; }
        [Key]
        [ForeignKey(nameof(nhanVien))]
        public int? nhanvien_id { get; set; }
        public string? ghichu { get; set; }
        public virtual NhanVien? nhanVien { get; set; }
        public virtual KeHoachKiemTra? keHoachKiemTra { get; set; }
    }
}