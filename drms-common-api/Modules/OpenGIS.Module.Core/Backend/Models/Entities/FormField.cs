using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using OfficeOpenXml.FormulaParsing.Excel.Functions.Logical;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("form_fields", Schema = "public")]
    public class FormField
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }

        public string? label { get; set; }
        [ForeignKey(nameof(form))]
        public int form_id { get; set; }
        [ForeignKey(nameof(column))]
        public int table_column_id { get; set; }
        public int order { get; set; }

        public virtual Form? form { get; set; }
        public virtual TableColumn? column { get; set; }
    }
}