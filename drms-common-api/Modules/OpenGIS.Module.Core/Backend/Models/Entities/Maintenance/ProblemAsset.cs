using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("p_problem_asset", Schema = "maintenance")]
    public class ProblemAsset
    {
        [Key]
        public int problem_id { get; set; }
        [Key]
        public string? asset_id { get; set; }
        public string? note { get; set; }
        public int? worder_id { get; set; }
        public int? layer_id { get; set; }
        [NotMapped]
        public Problem? problem { get; set; }

    }
}