using Swashbuckle.AspNetCore.Swagger;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("report_criteria", Schema = "public")]
    public class ReportCriteria
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? report_code { get; set; }
        [ForeignKey(nameof(tableGroupLevel))]
        public int table_relation_group_id { get; set; }
        public virtual TableRelationGroupLevel? tableGroupLevel { get; set; }
    }
}

