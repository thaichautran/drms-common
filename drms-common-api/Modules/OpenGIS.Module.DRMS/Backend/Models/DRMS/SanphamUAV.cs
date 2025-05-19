using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CBRM.Module.Core.Attributes;
using OpenGIS.Module.Core.Constants;
using OpenGIS.Module.DRMS.Models.Category;
using VietGIS.Infrastructure.Models.Regional;

namespace OpenGIS.Module.DRMS.Models.DRMS
{
    [Table("sanpham_uav", Schema = "drms_daknong")]
    public class SanphamUAV
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Required]
        public int id { get; set; }
        [Required]
        [StringLength(100)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string ten_sanpham { get; set; } = string.Empty;
        [StringLength(256)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string mo_ta { get; set; } = string.Empty;
        public DateTime? ngay_xaydung { get; set; }
        [ForeignKey(nameof(district))]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? district_code { get; set; }
        public virtual District? district { get; set; }
        [ForeignKey(nameof(commune))]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? commune_code { get; set; }
        public virtual Commune? commune { get; set; }
        public virtual IEnumerable<File>? listFiles { get; set; }
        [NotMapped]
        public int nam_xaydung => ngay_xaydung?.Year ?? 0;

        [Table("sanpham_uav_file", Schema = "drms_daknong")]
        public sealed class File
        {
            [Key]
            [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
            [Required]
            public int id { get; set; }
            [Required]
            [ForeignKey(nameof(sanPham))]
            public int sanpham_id { get; set; }
            [ForeignKey(nameof(loaiSanPham))]
            public int loai_sanpham_id { get; set; }
            [Required]
            [StringLength(100)]
            [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
            public string tenfile_goc { get; set; } = string.Empty;
            [Required]
            [StringLength(100)]
            [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
            public string tenfile_luutru { get; set; } = string.Empty;
            [UrlValidator(ErrorMessage = Constants.URL_VALIDATE_ERROR)]
            public string url { get; set; } = string.Empty;
            public DmLoaiSanphamUAV? loaiSanPham { get; set; }
            public SanphamUAV? sanPham { get; set; }
            [NotMapped]
            public string extension => Path.GetExtension(tenfile_goc);
        }
    }
}