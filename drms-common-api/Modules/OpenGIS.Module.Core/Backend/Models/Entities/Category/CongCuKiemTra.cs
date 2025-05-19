using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Category
{
    [Table("dm_congcu_kiemtra", Schema = "category")]
    public class CongCuKiemTra
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? mo_ta { get; set; }
    }
}
