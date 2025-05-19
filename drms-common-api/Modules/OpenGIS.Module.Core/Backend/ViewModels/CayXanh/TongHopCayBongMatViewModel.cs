using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OpenGIS.Module.Core.ViewModels.CayXanh
{
    public class TongHopCayBongMatViewModel
    {
        public string? district { get; set; }
        public string? district_code { get; set; }
        public string? matuyen { get; set; }
        public int? madonviquanly { get; set; }
        public int? manhathau { get; set; }
        public string? mahopdongquanly { get; set; }
        public double? total { get; set; }
        public double? phanloai_caycothu { get; set; }
        public double? phanloai_caybongmat { get; set; }
        public double? phanloai_vitritrong { get; set; }
        public double? phanloai_cayquyhiem { get; set; }
        public double? hientrang_caymoitrong { get; set; }
        public double? hientrang_vitritrong { get; set; }
        public double? hientrang_binhthuong { get; set; }
        public double? hientrang_chet { get; set; }
        public double? hientrang_nguyhiem { get; set; }
        public double? vitri_congvien { get; set; }
        public double? vitri_dao { get; set; }
        public double? vitri_daiphancach { get; set; }
        public double? vitri_gamcau { get; set; }
        public double? vitri_kdt { get; set; }
        public double? vitri_phai { get; set; }
        public double? vitri_trai { get; set; }
        public double? vitri_vuonhoa { get; set; }
        public string? tentuyen { get; set; }
        public string? donviquanly { get; set; }
        public string? nhathau { get; set; }
    }
    public class BaoCaoCayBongMatViewModel
    {
        public int index { get; set; }
        public IEnumerable<IGrouping<string, TongHopCayBongMatViewModel>>? records { get; set; }
        public IEnumerable<TongHopCayBongMatViewModel>? raw { get; set; }
        public IEnumerable<TongHopCayBongMatViewModel>? districtTotal { get; set; }
        public TongHopCayBongMatViewModel? reportTotal { get; set; }
    }
}