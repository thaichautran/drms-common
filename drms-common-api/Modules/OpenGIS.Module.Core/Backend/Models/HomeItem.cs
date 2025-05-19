using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models
{
    [Table("home_items", Schema = "public")]
    public class HomeItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }

        public string? name { get; set; } = "";
        public string? icon { get; set; }
        public string? url { get; set; }
        public bool? visible { get; set; } = true;
        public int? order { get; set; } = 0;
        public int? parent_id { get; set; } = 0;
        public int nhom_id { get; set; } = 0;
        public string? permission { get; set; }
        [NotMapped]
        public string? parent_name { get; set; }
    }
}