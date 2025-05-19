using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OpenGIS.Module.DRMS.ViewModels
{
    public class NhaOViewModel
    {
        public int so_khau { get; set; }
        public int so_nam { get; set; }
        public int so_nu { get; set; }
        public double lon { get; set; }
        public double lat { get; set; }
        public string? commune_code { get; set; }
        public string? dia_chi { get; set; }
        public string? nguon_solieu { get; set; }
    }
    public class NhaVanHoaViewModel
    {
        public string? ten_nhavh { get; set; }
        public string? dia_chi { get; set; }
        public int so_tiepnhan { get; set; }
        public double lon { get; set; }
        public double lat { get; set; }
        public string? commune_code { get; set; }
        public bool co_vs_nam_nu { get; set; }
        public bool co_nuoc_sach { get; set; }
        public bool co_hotro_chong_thientai { get; set; }
    }
    public class TruongHocViewModel
    {
        public string? ten_truong { get; set; }
        public string? dia_chi { get; set; }
        public double lon { get; set; }
        public double lat { get; set; }
        public int so_phonghoc { get; set; }
        public int so_hocsinh { get; set; }
        public int so_gv_cb { get; set; }
        public int so_tiepnhan { get; set; }
        public string? commune_code { get; set; }
        public bool co_vs_nam_nu { get; set; }
        public bool co_nuoc_sach { get; set; }
        public bool co_hotro_chong_thientai { get; set; }
    }
    public class CoSoYTeViewModel
    {
        public string? ten_coso { get; set; }
        public string? dia_chi { get; set; }
        public int so_phongbenh { get; set; }
        public int tongso_nhansu { get; set; }
        public int so_tiepnhan { get; set; }
        public string? commune_code { get; set; }
        public bool co_vs_nam_nu { get; set; }
        public bool co_nuoc_sach { get; set; }
        public bool co_hotro_chong_thientai { get; set; }
        public double? lon { get; set; }
        public double? lat { get; set; }
    }
    public class UBNDViewModel
    {
        public string? ten_ubnd { get; set; }
        public string? dia_chi { get; set; }
        public double? lon { get; set; }
        public double? lat { get; set; }
        public int so_tiepnhan { get; set; }
        public string? commune_code { get; set; }
        public bool co_vs_nam_nu { get; set; }
        public bool co_nuoc_sach { get; set; }
        public bool co_hotro_chong_thientai { get; set; }
        public bool co_tiepcan_nguoikhuyettat { get; set; }
    }
}