using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;
namespace OpenGIS.Module.Core.ViewModels
{
    public class CustomReportViewModel
    {
        public string? tenho { get; set; }
        public string? luuvuvid { get; set; }
        public string? matuyen { get; set; }
        public string? tentuyen { get; set; }
        public string? layer_name { get; set; }
        public string? table_name { get; set; }
        public int? table_id { get; set; }
        public int? layer_id { get; set; }
        public string? group_level_1 { get; set; }
        public string? group_level_2 { get; set; }
        public double? count { get; set; }
        public string? donvitinh { get; set; }
        public string? matram { get; set; }
        public string? tentram { get; set; }
    }

    public class TongHopThoatNuocViewModel
    {
        public string? quanhuyen { get; set; }
        public int so_tuyen { get; set; }
        public int cong_thoatnuoc { get; set; }
        public int ranh_thoatnuoc { get; set; }
        public int ho_ga { get; set; }
        public int nhamay_xuly { get; set; }
        public int ho_dieuhoa { get; set; }
        public int muong_song { get; set; }
        public int diemden_ngaplut { get; set; }
        public int cua_xa { get; set; }
        public int tram_bom { get; set; }
    }
}
