using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations; 
using System.ComponentModel.DataAnnotations.Schema;
using VietGIS.Infrastructure.Models.Database.Map;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("synthesis_report", Schema = "public")]
    public class SynthesisReport
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        [Required] public string? report_name { get; set; }
        [ForeignKey(nameof(layer))]
        [Required] public int? layer_id { get; set; }
        public DateTime? created_at { get; set; }
        public string? created_by { get; set; }
        public int? map_id { get; set; }
        public string? visible_columns { get; set; }
        public string? filter_columns { get; set; }
        public string? filter_params { get; set; }
        public virtual Layer? layer { get; set; }
        public IEnumerable<ReportField>? reportFields { get; set; }
    }
}