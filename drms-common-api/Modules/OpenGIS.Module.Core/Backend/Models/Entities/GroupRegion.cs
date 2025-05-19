using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("group_regions", Schema = "public")]
    public class GroupRegion
    {
        [Key]
        public string? group_id { get; set; }
        [Key]
        public string? district_code { get; set; }
    }
}

