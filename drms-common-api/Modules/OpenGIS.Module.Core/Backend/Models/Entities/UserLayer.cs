using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("user_layers", Schema = "public")]
    public class UserLayer
    {
        [Key]
        public string? user_id { get; set; }
        
        [Key]
        public int? layer_id { get; set; }
    }
}