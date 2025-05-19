using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("report_fields", Schema = "public")]
    public class ReportField
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        [Required]
        [ForeignKey(nameof(report))]
        public int report_id { get; set; }
        [ForeignKey(nameof(tableColumn))]
        [Required] public int column_id { get; set; }
        public string? content_search { get; set; }
        public bool is_searchable { get; set; }
        public bool is_showable { get; set; }
        public string? table_mediate_name { get; set; }
        public virtual SynthesisReport? report { get; set; }
        public virtual TableColumn? tableColumn { get; set; }
    }
}