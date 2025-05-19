using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OpenGIS.Module.Core.ViewModels
{
    public class BaoCaoTongHopChieuSangViewModel
    {
        public string? district { get; set; }
        public string? district_code { get; set; }
        public double? total { get; set; }
        public double? ttdk { get; set; }
        public double? dhhg { get; set; }
        public double? chieudai { get; set; }
        public double? congsuat { get; set; }
        public double? so_cotden { get; set; }
        public double? so_boden { get; set; }
    }
    public class BaoCaoTongHopChieuSangDVQLViewModel
    {
        public string? dis_name { get; set; }
        public double? tramden_so { get; set; }
        public double? tramden_quan { get; set; }
        public double? ttdk_so { get; set; }
        public double? ttdk_quan { get; set; }
        public double? dhhg_so { get; set; }
        public double? dhhg_quan { get; set; }
        public double? chieudaituyen_so { get; set; }
        public double? chieudaituyen_quan { get; set; }
        public double? congsuat_so { get; set; }
        public double? congsuat_quan { get; set; }
        public double? so_cotden_so { get; set; }
        public double? so_cotden_quan { get; set; }
        public double? so_boden_so { get; set; }
        public double? so_boden_quan { get; set; }
    }
    public class BaoCaoSoLieuChieuSangTheoTuyenViewModel
    {
        public string? district { get; set; }
        public string? matuyen { get; set; }
        public string? tentuyen { get; set; }
        public string? table_name { get; set; }
        public double? solieu_quan { get; set; }
        public double? solieu_so { get; set; }
    }
    public class BaoCaoSoLieuChieuSangViewModel
    {
        public string? district { get; set; }
        public string? district_code { get; set; }
        public string? tentuyen { get; set; }
        public string? tentramden { get; set; }
        public string? loai { get; set; }
        public string? matuyen { get; set; }
        public string? table_name { get; set; }
        public double? total { get; set; }
        public double? congsuat { get; set; }
        public double? chieudai { get; set; }
    }
    public class BaoCaoSoLieuChieuSangTheoQuanViewModel : BaoCaoSoLieuChieuSangViewModel
    {
        public string? matramden { get; set; }
        public string? donviquanly { get; set; }
        public string? nhathau { get; set; }
    }

    public class SoLieuChieuSangViewModel
    {
        public IEnumerable<string>? loaicotden { get; set; }
        public IEnumerable<string>? loaicapngam { get; set; }
        public IEnumerable<string>? loaicaptreo { get; set; }
        public IEnumerable<string>? loaiboden { get; set; }
        public IEnumerable<BaoCaoSoLieuChieuSangViewModel>? records { get; set; }
    }
    public class SoLieuChieuSangTheoQuanViewModel
    {
        public IEnumerable<string>? loaicotden { get; set; }
        public IEnumerable<string>? loaicapngam { get; set; }
        public IEnumerable<string>? loaicaptreo { get; set; }
        public IEnumerable<string>? loaiboden { get; set; }
        public IEnumerable<BaoCaoSoLieuChieuSangTheoQuanViewModel>? records { get; set; }
    }
}