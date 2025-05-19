using System.Collections;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using OpenGIS.Module.Core.Constants;


namespace OpenGIS.Module.DRMS.ViewModels
{
    public class TonghopVungSummaryInfo
    {
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? ten_vung { get; set; }
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? ma_vung { get; set; }
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string? loai_thientai { get; set; }
        public int tong { get; set; }
        public float center_lng { get; set; }
        public float center_lat { get; set; }
        // public IEnumerable<ChartViewModel>? thongke_loai_thientai { get; set; }
    }
}