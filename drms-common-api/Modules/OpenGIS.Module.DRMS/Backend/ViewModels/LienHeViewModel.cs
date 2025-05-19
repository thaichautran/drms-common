using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using OpenGIS.Module.Core.Attributes;
using OpenGIS.Module.Core.Constants;
using OpenGIS.Module.DRMS.Models;

namespace OpenGIS.Module.DRMS.ViewModels
{
    [System.ComponentModel.DisplayName("Thông tin liên hệ")]
    public class LienHeViewModel
    {
        [Required(ErrorMessage = "Tên liên hệ không được để trống")]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? ho_ten { get; set; }
        // [Required(ErrorMessage = "Số điện thoại liên hệ không được để trống")]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        [PhoneNumberValidator(ErrorMessage = "Sai định dạng số điện thoại! Vui lòng kiểm tra lại")]
        public string? dien_thoai { get; set; }
        // [Required(ErrorMessage = "Email không được để trống")]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        [DataType(DataType.EmailAddress)]
        [EmailAddress]
        public string? email { get; set; }
        [Required(ErrorMessage = "Địa chỉ liên hệ không được để trống")]

        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? dia_chi { get; set; }
        //[Required(ErrorMessage = "Đơn vị liên hệ không được để trống")]

        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? don_vi { get; set; }
        //[Required(ErrorMessage = "Nội dung liên hệ không được để trống")]

        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? noi_dung { get; set; }
        public IEnumerable<LienHe.DinhKem>? listDinhKem { get; set; }

        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? tieu_de { get; set; }
    }
}