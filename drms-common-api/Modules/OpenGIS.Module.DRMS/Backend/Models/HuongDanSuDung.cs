using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using OpenGIS.Module.Core.Constants;

namespace OpenGIS.Module.DRMS.Models
{
    [Table("hdsd", Schema = "public")]
    public class HuongDanSuDung
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Required]
        public int id { get; set; }
        [Required]
        [StringLength(256)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string tieu_de { get; set; } = string.Empty;
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? noi_dung { get; set; }
        public int order_id { get; set; }
        public int title_level { get; set; }
        public int parent_id { get; set; }
    }
}