using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using OpenGIS.Module.Core.Constants;

namespace OpenGIS.Module.DRMS.Models.DRMS
{
    [Table("ubnd", Schema = "drms")]
    public class UBND
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Required]
        public int id { get; set; }
        [Required]
        [StringLength(256)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string ten_uyban { get; set; } = string.Empty;
        public int songuoi_sotan { get; set; }
        public string dia_diem { get; set; } = string.Empty;
        public string mo_ta { get; set; } = string.Empty;
        public string district_code { get; set; } = string.Empty;
        public string commune_code { get; set; } = string.Empty;
        public string province_code { get; set; } = string.Empty;
        public bool? co_nhavs { get; set; }
        public bool co_nuocsach { get; set; }
        public bool co_tiepcan_nguoikhuyettat { get; set; }
        public bool co_hotro_chong_thientai { get; set; }
        public int nam_thongke { get; set; }
        [NotMapped]
        public double lon { get; set; }
        [NotMapped]
        public double lat { get; set; }

    }
}