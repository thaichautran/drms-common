using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using OpenGIS.Module.Core.Constants;
using OpenGIS.Module.DRMS.Models.Category;
using VietGIS.Infrastructure.Models.Regional;

namespace OpenGIS.Module.DRMS.Models.DRMS
{
    [Table("ds_bando", Schema = "drms")]
    public class DanhSachBanDo
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Required]
        public int id { get; set; }
        [Required]
        [StringLength(100)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string ten_bando { get; set; } = string.Empty;

        [StringLength(256)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? mo_ta { get; set; }

        [ForeignKey(nameof(loaiBanDo))]
        public int loai_bando_id { get; set; }
        [Required]
        [StringLength(100)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string tenfile_luutru { get; set; } = string.Empty;
        [Required]
        [StringLength(100)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string tenfile_goc { get; set; } = string.Empty;
        public int? nam_xaydung { get; set; }
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? url { get; set; }
        public virtual DmLoaiBanDo? loaiBanDo { get; set; }
        [ForeignKey(nameof(province))]
        public string? province_code { get; set; }
        [ForeignKey(nameof(district))]
        public string? district_code { get; set; }
        [ForeignKey(nameof(commune))]
        public string? commune_code { get; set; }
        public virtual Province? province { get; set; }
        public virtual District? district { get; set; }
        public virtual Commune? commune { get; set; }
    }
}