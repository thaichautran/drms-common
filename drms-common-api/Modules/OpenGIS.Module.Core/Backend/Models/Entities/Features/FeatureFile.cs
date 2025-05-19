using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Http;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("feature_files", Schema = "public")]
    public class FeatureFile
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }

        public int layer_id { get; set; }
        public string? feature_id { get; set; }
        public string? file_name { get; set; }
        public string? mime_type { get; set; }
        public string? extension { get; set; }
        public long? size { get; set; }
        public IFormFile? raw { get; set; }
        public string? url { get; set; }
        public string path => $"/api/files/feature/{layer_id}/{feature_id}/{file_name}";
    }
}