using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Http;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("table_files", Schema = "public")]
    public class TableFiles
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }

        public int table_id { get; set; }
        public string? feature_id { get; set; }
        public string? file_name { get; set; }
        public string? mime_type { get; set; }
        public string? extension { get; set; }
        public long? size { get; set; }

        
        public IFormFile? raw { get; set; }

        
        public string path => $"/api/files/table/{table_id}/{feature_id}/{file_name}";
    }
}