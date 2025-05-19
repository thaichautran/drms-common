using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("kiemtrabaoduongcongtrinh", Schema = "maintenance")]
    public class KiemTraBaoDuongCongTrinh
    {

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public int? phieugiamsat_id { get; set; }
        public string? loaikiemtra { get; set; }
        [ForeignKey(nameof(table))]
        public int? table_id { get; set; }
        public string? feature_id { get; set; }
        // public string? table_name { get; set; }
        public string? feature_name { get; set; }
        [NotMapped]
        public TableInfo? table { get; set; }
    }
}
