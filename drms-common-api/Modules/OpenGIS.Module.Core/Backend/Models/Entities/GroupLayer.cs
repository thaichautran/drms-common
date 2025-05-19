using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("group_layers", Schema = "public")]
    public class GroupLayer
    {
        [Key]
        public string? group_id { get; set; }

        [Key]
        public int? layer_id { get; set; }
    }
}
