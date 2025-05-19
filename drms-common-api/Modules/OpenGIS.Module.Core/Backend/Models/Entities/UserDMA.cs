using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VietGIS.Infrastructure.Models.Regional;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("user_dmas", Schema = "public")]
    public class UserDMA
    {
        [Key]
        public string? user_id { get; set; }
        [Key]
        public string? iddma { get; set; }
    }
}

