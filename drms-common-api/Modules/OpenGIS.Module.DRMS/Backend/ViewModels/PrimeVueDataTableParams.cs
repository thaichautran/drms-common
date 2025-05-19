using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using OpenGIS.Module.Core.ViewModels.DatatableParams;
using OpenGIS.Module.DRMS.Enums;
using VietGIS.Infrastructure.Models.DTO.Request;

namespace OpenGIS.Module.DRMS.ViewModels
{
    public class PanUngPhoParams : PrimeVueDataTableParams
    {
        public IEnumerable<string>? listProvinceCode { get; set; }
        public IEnumerable<string>? listDistrictCode { get; set; }
        public IEnumerable<string>? listCommuneCode { get; set; }
        public IEnumerable<int>? listLoaiThienTai { get; set; }
        public IEnumerable<int>? listYear { get; set; }
        public IEnumerable<int>? listCapPhuongAnId { get; set; }
        public IEnumerable<int>? listLoaiPhuongAnId { get; set; }
    }
    public class PanUngPhoMapParams : PanUngPhoParams
    {
        /// <summary>
        /// 1: Thống kê theo đơn vị hành chính
        /// 2: Thống kê theo loại hình thiên tai
        /// </summary>
        public int? loaiThongKe { get; set; } = (int)EnumLoaiThongKePanBanDo.HANH_CHINH;
    }

    public class TaiLieuParams : PrimeVueDataTableParams
    {
        public IEnumerable<string>? listProvinceCode { get; set; }
        public IEnumerable<string>? listDistrictCode { get; set; }
        public IEnumerable<string>? listCommuneCode { get; set; }
        public IEnumerable<int>? listNamTaiLieu { get; set; }
        public List<int>? listPhanLoaiTaiLieuId { get; set; }
        public List<int>? listTinhTrangTaiLieuId { get; set; }
        public List<int>? listDonViPhatHanhId { get; set; }
        public List<int>? listLinhVucId { get; set; }
        public DateTime? from { get; set; }
        public DateTime? to { get; set; }
    }
    public class SanphamUAVParams : PrimeVueDataTableParams
    {
        public IEnumerable<string>? listDistrictCode { get; set; }
        public IEnumerable<string>? listCommuneCode { get; set; }
        public DateTime? from { get; set; }
        public DateTime? to { get; set; }
    }

    public class DanhSachBanDoParams : PrimeVueDataTableParams
    {
        public IEnumerable<int>? listNamXayDung { get; set; }
        public int? loaiBanDoId { get; set; }
        public IEnumerable<string>? listProvinceCode { get; set; }
        public IEnumerable<string>? listDistrictCode { get; set; }
        public IEnumerable<string>? listCommuneCode { get; set; }
    }
}