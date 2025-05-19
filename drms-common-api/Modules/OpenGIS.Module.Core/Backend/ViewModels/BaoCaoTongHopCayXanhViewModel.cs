using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OpenGIS.Module.Core.ViewModels
{
    public class BaoCaoTongHopCayXanhViewModel
    {
        public string? district { get; set; }
        public string? district_code { get; set; }
        // public int? madonviquanly { get; set; }
        // public int? manhathau { get; set; }
        // public string? mahopdongquanly { get; set; }
        public double? cx_caybongmat { get; set; }
        public double? cx_caybongmat_so { get; set; }
        public double? cx_caybongmat_hanhchinh { get; set; }
        public double? cx_caycanhkhom { get; set; }
        public double? cx_caycanhkhom_so { get; set; }
        public double? cx_caycanhkhom_hanhchinh { get; set; }
        public double? cx_caytrongmang { get; set; }
        public double? cx_caytrongmang_so { get; set; }
        public double? cx_caytrongmang_hanhchinh { get; set; }
        public double? cx_cayhangrao { get; set; }
        public double? cx_cayhangrao_so { get; set; }
        public double? cx_cayhangrao_hanhchinh { get; set; }
        public double? cx_thamco { get; set; }
        public double? cx_thamco_so { get; set; }
        public double? cx_thamco_hanhchinh { get; set; }
        public double? cx_hoathoivu { get; set; }
        public double? cx_hoathoivu_so { get; set; }
        public double? cx_hoathoivu_hanhchinh { get; set; }
        public double? cx_hoaluunien { get; set; }
        public double? cx_hoaluunien_so { get; set; }
        public double? cx_hoaluunien_hanhchinh { get; set; }
        public double? cx_caykeo { get; set; }
        public double? cx_caykeo_so { get; set; }
        public double? cx_caykeo_hanhchinh { get; set; }
        // public string? donviquanly { get; set; }
        // public string? nhathau { get; set; }
        public IEnumerable<BaoCaoTongHopCayXanhTheoTuyenViewModel>? duLieuTuyen { get; set; }
    }
    public class BaoCaoTongHopCayXanhTheoTuyenViewModel
    {
        public string? matuyen { get; set; }
        public string? tentuyen { get; set; }
        public double? cx_caybongmat { get; set; }
        public double? cx_caybongmat_so { get; set; }
        public double? cx_caybongmat_hanhchinh { get; set; }
        public double? cx_caycanhkhom { get; set; }
        public double? cx_caycanhkhom_so { get; set; }
        public double? cx_caycanhkhom_hanhchinh { get; set; }
        public double? cx_caytrongmang { get; set; }
        public double? cx_caytrongmang_so { get; set; }
        public double? cx_caytrongmang_hanhchinh { get; set; }
        public double? cx_cayhangrao { get; set; }
        public double? cx_cayhangrao_so { get; set; }
        public double? cx_cayhangrao_hanhchinh { get; set; }
        public double? cx_thamco { get; set; }
        public double? cx_thamco_so { get; set; }
        public double? cx_thamco_hanhchinh { get; set; }
        public double? cx_hoathoivu { get; set; }
        public double? cx_hoathoivu_so { get; set; }
        public double? cx_hoathoivu_hanhchinh { get; set; }
        public double? cx_hoaluunien { get; set; }
        public double? cx_hoaluunien_so { get; set; }
        public double? cx_hoaluunien_hanhchinh { get; set; }
        public double? cx_caykeo { get; set; }
        public double? cx_caykeo_so { get; set; }
        public double? cx_caykeo_hanhchinh { get; set; }
    }
    public class BaoCaoTongHopCayXanhRenderViewModel
    {
        public BaoCaoTongHopCayXanhViewModel? total { get; set; }
        public IEnumerable<BaoCaoTongHopCayXanhViewModel>? records { get; set; }
    }
    public class BaoCaoTongHopCayKhomMangViewModel
    {
        public string? district { get; set; }
        public string? district_code { get; set; }
        public string? tentuyen { get; set; }
        public int? madonviquanly { get; set; }
        public int? manhathau { get; set; }
        public string? mahopdongquanly { get; set; }
        public double? cx_caycanhkhom { get; set; }
        public double? cx_caytrongmang { get; set; }
        public double? cx_cayhangrao { get; set; }
        public double? cx_thamco { get; set; }
        public double? cx_hoathoivu { get; set; }
        public double? cx_hoaluunien { get; set; }
        public string? donviquanly { get; set; }
        public string? nhathau { get; set; }
    }
    public class BaoCaoTongHopCayCanhKhomViewModel
    {
        public string? district { get; set; }
        public string? district_code { get; set; }
        public string? tentuyen { get; set; }
        public string? loaicay { get; set; }
        public double? total { get; set; }
        public string? donviquanly { get; set; }
        public string? nhathau { get; set; }
        public string? mahopdongquanly { get; set; }
    }
    public class BaoCaoTongHopCayHangRaoViewModel : BaoCaoTongHopCayCanhKhomViewModel
    {
    }
    public class BaoCaoTongHopCayTrongMangViewModel : BaoCaoTongHopCayCanhKhomViewModel
    {
    }
    public class BaoCaoTongHopHoaLuuNienViewModel
    {
        public string? district { get; set; }
        public string? district_code { get; set; }
        public string? tentuyen { get; set; }
        public string? loaihoa { get; set; }
        public double? total { get; set; }
        public string? donviquanly { get; set; }
        public string? nhathau { get; set; }
        public string? mahopdongquanly { get; set; }
    }
    public class BaoCaoTongHopHoaThoiVuViewModel : BaoCaoTongHopHoaLuuNienViewModel
    {
    }
    public class BaoCaoTongHopThamCoViewModel
    {
        public string? district { get; set; }
        public string? district_code { get; set; }
        public string? tentuyen { get; set; }
        public string? loaico { get; set; }
        public double? total { get; set; }
        public string? donviquanly { get; set; }
        public string? nhathau { get; set; }
        public string? mahopdongquanly { get; set; }
    }
    public class BaoCaoTongHopCongVienViewModel
    {
        public string? district { get; set; }
        public string? district_code { get; set; }
        public double? total { get; set; }
        public string? donviquanly { get; set; }
        public string? nhathau { get; set; }
        public string? mahopdongquanly { get; set; }
    }
    public class BaoCaoTongHopChanNuoiDongVatViewModel
    {
        public string? district { get; set; }
        public string? district_code { get; set; }
        public double? lopthu { get; set; }
        public double? lopbosat { get; set; }
        public double? lopchim { get; set; }
        public string? donviquanly { get; set; }
        public string? nhathau { get; set; }
        public string? mahopdongquanly { get; set; }
    }
    public class BaoCaoTongHopDuongDaoViewModel
    {
        public string? district { get; set; }
        public string? district_code { get; set; }
        public string? tentuyen { get; set; }
        public double? total { get; set; }
        public string? donviquanly { get; set; }
        public string? nhathau { get; set; }
        public string? mahopdongquanly { get; set; }
    }
    public class BaoCaoTongHopThoatNuocCongVienViewModel
    {
        public string? district { get; set; }
        public string? district_code { get; set; }
        public string? tentuyen { get; set; }
        public double? cv_ranhthoatnuoc { get; set; }
        public int? cv_hoga { get; set; }
        public string? donviquanly { get; set; }
        public string? nhathau { get; set; }
        public string? mahopdongquanly { get; set; }
    }
    public class BaoCaoTongHopChuongChanNuoiViewModel
    {
        public string? district { get; set; }
        public string? district_code { get; set; }
        public int? soluongchuong { get; set; }
        public double? dientichnenchuong { get; set; }
        public double? dientichsanbai { get; set; }
        public double? dientichbetam { get; set; }
        public double? dientichhaochuongvoi { get; set; }
        public string? donviquanly { get; set; }
        public string? nhathau { get; set; }
        public string? mahopdongquanly { get; set; }
    }
}