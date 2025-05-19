using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using CBRM.Module.Core.Attributes;
using OpenGIS.Module.Core.Attributes;
using OpenGIS.Module.Core.Constants;

namespace OpenGIS.Module.DRMS.Models
{
    [Table("lien_he", Schema = "public")]
    public class LienHe
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? ho_ten { get; set; }
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        [PhoneNumberValidator(ErrorMessage = "Sai định dạng số điện thoại! Vui lòng kiểm tra lại")]
        public string? dien_thoai { get; set; }
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        [DataType(DataType.EmailAddress)]
        [EmailAddress(ErrorMessage = "Sai định dạng email! Vui lòng kiểm tra lại")]
        public string? email { get; set; }
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? dia_chi { get; set; }
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? don_vi { get; set; }
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? noi_dung { get; set; }
        public bool da_xem { get; set; }
        [Required]
        public DateTime thoi_gian { get; set; }
        [Required]
        public DateTime thoigian_capnhat { get; set; }
        public bool da_traloi { get; set; }
        [NotMapped]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? thoi_gian_txt => thoi_gian.ToString("HH:mm dd/MM/yyyy");
        [NotMapped]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? thoigian_capnhat_txt => thoigian_capnhat.ToString("HH:mm dd/MM/yyyy");
        public virtual IEnumerable<DinhKem>? listDinhKem { get; set; }
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? tieu_de { get; set; }

        [Table("lien_he", Schema = "public")]
        public sealed class DinhKem
        {
            [Key]
            [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
            [Required]
            public int id { get; set; }
            [ForeignKey(nameof(lienHe))]
            public int lienhe_id { get; set; }
            public LienHe? lienHe { get; set; }
            [Required]
            [StringLength(100)]
            [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
            public string tenfile_luutru { get; set; } = string.Empty;
            [Required]
            [StringLength(256)]
            [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
            public string tenfile_goc { get; set; } = string.Empty;
            [UrlValidator(ErrorMessage = Constants.URL_VALIDATE_ERROR)]
            public string url { get; set; } = string.Empty;
        }
    }

}