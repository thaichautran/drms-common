using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VietGIS.Infrastructure.Models.Regional;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("user_regions", Schema = "public")]
    public class UserRegion
    {
        [Key]
        public string? user_id { get; set; }
        [Key]
        // [ForeignKey(nameof(district))]
        // public string? district_code { get; set; }
        public string? area_code { get; set; }
        public int? area_type { get; set; }
        // [NotMapped]
        // public District? district { get; set; }
    }
}

