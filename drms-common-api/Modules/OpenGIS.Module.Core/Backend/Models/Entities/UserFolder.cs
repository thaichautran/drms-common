using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("user_folder", Schema = "identity")]
    public class UserFolder
    {
        [Key]
        public string? user_id { get; set; }

        [Key]
        public int? folder_id { get; set; }
    }
}