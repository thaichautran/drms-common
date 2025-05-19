using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.IO;
using System.Linq;
using OpenGIS.Module.Core.Constants;
using OpenGIS.Module.DRMS.Models.Category;
using VietGIS.Infrastructure.Models.Regional;

namespace OpenGIS.Module.DRMS.Models
{
    [Table("tai_lieu", Schema = "public")]
    public class TaiLieu
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Required]
        public int id { get; set; }
        [Required]
        [StringLength(100)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string tenfile_luutru { get; set; } = string.Empty;
        [Required]
        [StringLength(100)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string tenfile_goc { get; set; } = string.Empty;
        [Required]
        [StringLength(256)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string ten_tailieu { get; set; } = string.Empty;
        [StringLength(30)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? so_vanban { get; set; }
        public DateTime? ngay_phathanh { get; set; }
        public DateTime? ngay_hieuluc { get; set; }
        public int? nam_tailieu { get; set; }
        // [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? noi_dung { get; set; }
        [StringLength(256)]
        // [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? ghi_chu { get; set; }
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? url { get; set; }
        [Required]
        [ForeignKey(nameof(phanLoaiTaiLieu))]
        public int phanloai_tailieu_id { get; set; }
        [Required]
        [ForeignKey(nameof(donViPhatHanh))]
        public int donvi_phathanh_id { get; set; } = 0;
        [Required]
        [ForeignKey(nameof(tinhTrangTaiLieu))]
        public int tinhtrang_tailieu_id { get; set; }
        [ForeignKey(nameof(linhVuc))]
        public int linhvuc_id { get; set; }
        public virtual DmPhanloaiTailieu? phanLoaiTaiLieu { get; set; }
        public virtual DmDonViPhatHanh? donViPhatHanh { get; set; }
        public virtual DmTinhTrangTaiLieu? tinhTrangTaiLieu { get; set; }
        public virtual DmLinhVuc? linhVuc { get; set; }
        public virtual IEnumerable<CapHanhchinh>? listCapHanhChinh { get; set; }
        [NotMapped]
        public string? extension => Path.GetExtension(tenfile_luutru)?.ToLower();

        [Table("tailieu_cap_hanhchinh", Schema = "public")]
        public sealed class CapHanhchinh
        {
            [Key]
            [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
            public int id { get; set; }
            [Required]
            [ForeignKey(nameof(taiLieu))]
            public int tailieu_id { get; set; }
            public TaiLieu? taiLieu { get; set; }
            [ForeignKey(nameof(province))]
            [StringLength(3)]
            [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
            public string province_code { get; set; } = string.Empty;
            // [Key]
            [ForeignKey(nameof(district))]
            [StringLength(5)]
            [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
            public string? district_code { get; set; } = string.Empty;
            // [Key]
            [ForeignKey(nameof(commune))]
            [StringLength(7)]
            [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
            public string? commune_code { get; set; } = string.Empty;
            public Province? province { get; set; }
            public District? district { get; set; }
            public Commune? commune { get; set; }
        }

    }
}