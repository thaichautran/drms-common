using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OpenGIS.Module.Core.ViewModels
{
    public class BaoCaoTongHopThoatNuocViewModel
    {
        public string? district { get; set; }
        public string? district_code { get; set; }
        public double? dm_tuyentn { get; set; }
        public double? dm_tuyentn_so { get; set; }
        public double? dm_tuyentn_hanhchinh { get; set; }
        public double? tn_congthoatnuoc { get; set; }
        public double? tn_congthoatnuoc_so { get; set; }
        public double? tn_congthoatnuoc_hanhchinh { get; set; }
        public double? tn_ranhthoatnuoc { get; set; }
        public double? tn_ranhthoatnuoc_so { get; set; }
        public double? tn_ranhthoatnuoc_hanhchinh { get; set; }
        public double? tn_hoga { get; set; }
        public double? tn_hoga_so { get; set; }
        public double? tn_hoga_hanhchinh { get; set; }
        public double? tn_nhamayxulynuocthai { get; set; }
        public double? tn_nhamayxulynuocthai_so { get; set; }
        public double? tn_nhamayxulynuocthai_hanhchinh { get; set; }
        public double? tn_hodieuhoa { get; set; }
        public double? tn_hodieuhoa_so { get; set; }
        public double? tn_hodieuhoa_hanhchinh { get; set; }
        public double? tn_muongthoatnuoc { get; set; }
        public double? tn_muongthoatnuoc_so { get; set; }
        public double? tn_muongthoatnuoc_hanhchinh { get; set; }
        public double? tn_diemdenngaplut { get; set; }
        public double? tn_diemdenngaplut_so { get; set; }
        public double? tn_diemdenngaplut_hanhchinh { get; set; }
        public double? tn_cuaxa { get; set; }
        public double? tn_cuaxa_so { get; set; }
        public double? tn_cuaxa_hanhchinh { get; set; }
        public double? tn_trambomthoatnuoc { get; set; }
        public double? tn_trambomthoatnuoc_so { get; set; }
        public double? tn_trambomthoatnuoc_hanhchinh { get; set; }
        public string? ghi_chu { get; set; }
        public IEnumerable<BaoCaoTuyenThoatNuocViewModel>? duLieuTuyen { get; set; }
    }
    public class BaoCaoTongHopDuLieuChiTietViewModel
    {
        public string? district { get; set; }
        public string? loai { get; set; }
        public string? matuyen { get; set; }
        public string? tentuyen { get; set; }
        public string? table_name { get; set; }
        public double? solieu_quan { get; set; }
        public double? solieu_so { get; set; }
    }
    public class RenderBaoCaoTongHopDuLieuChiTietViewModel
    {
        public int? index { get; set; }
        public IEnumerable<BaoCaoTongHopDuLieuChiTietViewModel>? records { get; set; }
        public IEnumerable<BaoCaoTongHopDuLieuChiTietViewModel>? totals { get; set; }
    }

    public class BaoCaoTuyenThoatNuocViewModel
    {
        public string? matuyen { get; set; }
        public string? tentuyentn { get; set; }
        public double? dm_tuyentn_hanhchinh { get; set; }
        public double? tn_congthoatnuoc { get; set; }
        public double? tn_congthoatnuoc_so { get; set; }
        public double? tn_congthoatnuoc_hanhchinh { get; set; }
        public double? tn_ranhthoatnuoc { get; set; }
        public double? tn_ranhthoatnuoc_so { get; set; }
        public double? tn_ranhthoatnuoc_hanhchinh { get; set; }
        public double? tn_hoga { get; set; }
        public double? tn_hoga_so { get; set; }
        public double? tn_hoga_hanhchinh { get; set; }
        public double? tn_nhamayxulynuocthai { get; set; }
        public double? tn_nhamayxulynuocthai_so { get; set; }
        public double? tn_nhamayxulynuocthai_hanhchinh { get; set; }
        public double? tn_hodieuhoa { get; set; }
        public double? tn_hodieuhoa_so { get; set; }
        public double? tn_hodieuhoa_hanhchinh { get; set; }
        public double? tn_muongthoatnuoc { get; set; }
        public double? tn_muongthoatnuoc_so { get; set; }
        public double? tn_muongthoatnuoc_hanhchinh { get; set; }
        public double? tn_diemdenngaplut { get; set; }
        public double? tn_diemdenngaplut_so { get; set; }
        public double? tn_diemdenngaplut_hanhchinh { get; set; }
        public double? tn_cuaxa { get; set; }
        public double? tn_cuaxa_so { get; set; }
        public double? tn_cuaxa_hanhchinh { get; set; }
        public double? tn_trambomthoatnuoc { get; set; }
        public double? tn_trambomthoatnuoc_so { get; set; }
        public double? tn_trambomthoatnuoc_hanhchinh { get; set; }
    }
    public class BaoCaoThoatNuocRenderViewModel
    {
        public BaoCaoTongHopThoatNuocViewModel? total { get; set; }
        public IEnumerable<BaoCaoTongHopThoatNuocViewModel>? records { get; set; }
    }


}