using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("user_tables", Schema = "public")]
    public class UserTable
    {
        [Key]
        public string? user_id { get; set; }
        
        [Key]
        public int? table_id { get; set; }
    }
}