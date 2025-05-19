using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("maintenance_file", Schema = "maintenance")]
    public class MaintenanceFile
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? file_name { get; set; }
        public string? mime_type { get; set; }
        public string? extension { get; set; }
        public long? size { get; set; }
        public string? url { get; set; }
        [ForeignKey(nameof(worder))]
        public int? maintenance_id { get; set; }
        [NotMapped]
        public IFormFile? raw { get; set; }
        [NotMapped]
        public Worder? worder { get; set; }
    }
}