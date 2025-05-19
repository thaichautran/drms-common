using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("p_process_problem", Schema = "maintenance")]
    public class ProcessProblem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        [ForeignKey(nameof(problem))]
        public int? problem_id { get; set; }
        public string? ghichu { get; set; }
        public DateTime? thoigian_yeucau { get; set; }
        [NotMapped]
        public virtual Problem? problem { get; set; }
        [NotMapped]
        public virtual List<ProcessProblemWorker>? processProblemWorkers { get; set; }
        
    }
}