using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("maintenance_worker", Schema = "maintenance")]
    public class MaintenanceWorker
    {
        [Key]
        public int? maintenance_id { get; set; }
        [Key]
        public int? worker_id { get; set; }
        public string? ghichu { get; set; }
        [NotMapped]
        public virtual Worder? worder { get; set; }
        [NotMapped]
        public virtual NhanVien? worker { get; set; }
    }
}