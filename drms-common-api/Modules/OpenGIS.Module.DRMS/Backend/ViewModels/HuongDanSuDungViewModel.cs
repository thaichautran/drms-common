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
    [System.ComponentModel.DisplayName("Thông tin hướng dẫn sử dụng")]
    public class HuongDanSuDungViewModel
    {
        public int id { get; set; }
        [Required]
        [StringLength(256)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string tieu_de { get; set; } = string.Empty;
        public int order_id { get; set; }
        public int title_level { get; set; }
        public int parent_id { get; set; }
    }
}