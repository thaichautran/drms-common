using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("p_process_problem_worker", Schema = "maintenance")]
    public class ProcessProblemWorker
    {
        [Key]
        [ForeignKey(nameof(processProblem))]
        public int? process_problem_id { get; set; }
        [Key]
        [ForeignKey(nameof(nhanvien))]
        public int? nhanvien_id { get; set; }
        [NotMapped] 
        public virtual NhanVien? nhanvien { get; set; }
        [NotMapped]
        public virtual ProcessProblem? processProblem { get; set; }
    }
}