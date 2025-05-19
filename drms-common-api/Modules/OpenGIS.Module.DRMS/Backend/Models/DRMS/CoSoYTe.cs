using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using OpenGIS.Module.Core.Constants;

namespace OpenGIS.Module.DRMS.Models.DRMS
{
    [Table("coso_yte", Schema = "drms")]
    public class CoSoYTe
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Required]
        public int id { get; set; }
        [Required]
        [StringLength(256)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string ten_coso { get; set; } = string.Empty;
        public string district_code { get; set; } = string.Empty;
        public string commune_code { get; set; } = string.Empty;
        public string province_code { get; set; } = string.Empty;
        public int? phanloai_coso_id { get; set; }
        public int songuoi_sotan { get; set; }
        public int so_phongbenh { get; set; }
        public bool co_nhavs { get; set; }
        public bool co_nuocsach { get; set; }
        public string? mo_ta { get; set; }
        public string? dia_diem { get; set; }
        public int so_y_bacsi { get; set; }
        public int nam_thongke { get; set; }
        public bool co_hotro_chong_thientai { get; set; }
        public string? lv_code { get; set; }
        public double? lon { get; set; }
        public double? lat { get; set; }
    }
}