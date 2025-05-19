using System.Collections;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using OpenGIS.Module.Core.Constants;
using OpenGIS.Module.DRMS.Models.Category;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Models.Regional;

namespace OpenGIS.Module.DRMS.Models
{
    [Table("pan_ungpho_thientai", Schema = "drms")]
    public class PanUngphoThientai
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        [MaxLength(256)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string ten_phuongan { get; set; } = string.Empty;
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? mo_ta { get; set; }
        [ForeignKey(nameof(dmCapPhuongan))]
        public int cap_phuongan_id { get; set; }
        public int? nam_xaydung { get; set; }
        [ForeignKey(nameof(dmLoaiPhuongan))]
        public int loai_phuongan_id { get; set; }
        [MaxLength(10)]
        [ForeignKey(nameof(province))]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? province_code { get; set; }
        [MaxLength(10)]
        [ForeignKey(nameof(district))]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? district_code { get; set; }
        [MaxLength(10)]
        [ForeignKey(nameof(commune))]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? commune_code { get; set; }
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? created_by { get; set; }
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? updated_by { get; set; }
        public virtual DmLoaiPhuongan? dmLoaiPhuongan { get; set; }
        public virtual DmCapPhuongan? dmCapPhuongan { get; set; }
        public virtual Province? province { get; set; }
        public virtual District? district { get; set; }
        public virtual Commune? commune { get; set; }
        public virtual IEnumerable<PhuongAnMap>? listPhuongAnMap { get; set; }
        public virtual IEnumerable<PhuonganThientai>? listPhuongAnThienTai { get; set; }
        [NotMapped]
        public Map? map => listPhuongAnMap?.Count() > 0 ? listPhuongAnMap.FirstOrDefault()?.map : null;
    }
}