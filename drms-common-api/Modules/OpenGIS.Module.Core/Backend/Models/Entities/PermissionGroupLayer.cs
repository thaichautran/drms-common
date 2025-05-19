using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("permission_group_layers", Schema = "public")]
    public class PermissionGroupLayer
    {
        [Key]
        public int permission_group_id { get; set; }

        [Key]
        public int layer_id { get; set; }
    }
}
