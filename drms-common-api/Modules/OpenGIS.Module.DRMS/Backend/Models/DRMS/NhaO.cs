using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Index.Quadtree;
using OpenGIS.Module.Core.Constants;

namespace OpenGIS.Module.DRMS.Models.DRMS
{
    [Table("nha_o", Schema = "drms")]
    public class NhaO
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Required]
        public int id { get; set; }
        [Required]
        [StringLength(256)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? dia_chi { get; set; }
        public string? chu_ho { get; set; }
        public string? mo_ta { get; set; }
        public string? dia_diem { get; set; }
        public string? district_code { get; set; }
        public string? commune_code { get; set; }
        public string? province_code { get; set; }
        public int? so_nam { get; set; }
        public int so_nu { get; set; }
        public int songuoi_sotan { get; set; }
        [NotMapped]
        public double lon { get; set; }
        [NotMapped]
        public double lat { get; set; }
    }
}