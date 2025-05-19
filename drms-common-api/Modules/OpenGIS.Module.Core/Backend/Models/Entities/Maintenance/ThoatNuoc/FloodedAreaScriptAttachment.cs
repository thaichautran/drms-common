using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.IO;
using Microsoft.AspNetCore.Http;

namespace OpenGIS.Module.Core.Models.Entities.Maintenance.ThoatNuoc
{
    [Table("tn_kichbanngapung_dinhkem", Schema = "csdl_thoatnuoc")]
    public class FloodedAreaScriptAttachment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        [ForeignKey(nameof(kichBanNgapUng))]
        public int kichban_id { get; set; }
        public string? url { get; set; }
        public string? tenfile_goc { get; set; }
        public string? mime_type { get; set; }
        [NotMapped]
        public FloodedAreaScript? kichBanNgapUng { get; set; }
        [NotMapped]
        public IFormFile? raw { get; set; }
        [NotMapped]
        public string extension
        {
            get
            {

                var exs = Path.GetExtension(tenfile_goc);

                return exs.ToLower();

            }
        }
    }
}