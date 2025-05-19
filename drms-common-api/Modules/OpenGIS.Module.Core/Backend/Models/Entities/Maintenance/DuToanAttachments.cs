using Microsoft.AspNetCore.Components.Web.Virtualization;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance
{
    [Table("dutoan_attachments", Schema = "maintenance")]
    public class DuToanAttachments
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? file_name { get; set; }
        public string? mime_type { get; set; }
        public string? extension { get; set; }
        public long? size { get; set; }
        public string? store_file_name { get; set; }
        public string? url { get;set; }

        [ForeignKey(nameof(duToan))]
        public int? dutoan_id { get; set; }
        public virtual DuToanCongViecSuaChua? duToan { get; set; }
        [NotMapped]
        public IFormFile? file { get; set; }
    }
}
