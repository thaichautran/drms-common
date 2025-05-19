using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("anhminhhoakiemtra", Schema = "maintenance")]
    public class AnhMinhHoaKiemTra
    {
        public AnhMinhHoaKiemTra()
        {
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? file_name { get; set; }
        public string? mime_type { get; set; }
        public string? extension { get; set; }
        public long? size { get; set; }
        public string? url { get;set; }
        public int? phieugiamsat_id { get; set; }
        public string? loaikiemtra { get; set; }
        [NotMapped]
        public IFormFile? file { get; set; }
    }
}
