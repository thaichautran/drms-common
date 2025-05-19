using Swashbuckle.AspNetCore.Swagger;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("table_relation_group_level", Schema = "public")]
    public class TableRelationGroupLevel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        [ForeignKey(nameof(table))]
        public int? table_id { get; set; }
        public string? group_type { get; set; }
        public string? statistical_type { get; set; }
        public string? statistical_column { get; set; }
        public string? unit { get; set; }
        public string? column_group_level_1 { get; set; }
        public string? column_group_level_2 { get; set; }
        public string? condition { get; set; }
        public virtual TableInfo? table { get; set; }
    }
}

