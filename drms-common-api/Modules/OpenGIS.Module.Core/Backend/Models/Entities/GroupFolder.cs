using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("group_folder", Schema = "identity")]
    public class GroupFolder
    {
        [Key]
        public string? group_id { get; set; }

        [Key]
        public int? folder_id { get; set; }
    }
}