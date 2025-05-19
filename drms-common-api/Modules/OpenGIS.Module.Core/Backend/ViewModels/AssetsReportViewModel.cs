using System;
using System.Collections.Generic;
using OpenGIS.Module.Core.Models.Entities.Maintenance;


namespace OpenGIS.Module.Core.ViewModels
{
    public class AssetsReportViewModel
    {
        public int pageSize { get; set; }
        public int pageIndex { get; set; }
        public DateTime? ngay_batdau { get; set; }
        public DateTime? ngay_ketthuc { get; set; }
    }

    public class AssetsReportDistrictViewModal
    {
        public string? stt { get; set; }
        public string? name_vn { get; set; }
        public string? area_id { get; set; }
        public List<AssetsReportCommuneViewModal>? communes { get; set; }
    }
    public class AssetsReportCommuneViewModal
    {
        public string? stt { get; set; }
        public string? name_vn { get; set; }
        public string? area_id { get; set; }
        public List<AssetsReportStatusViewModal>? hienTrangs { get; set; }
    }

    public class AssetsReportStatusViewModal
    {
        public string? stt { get; set; }
        public string? hientrangid { get; set; }
        public List<TuyNenKyThuat>? datas { get; set; }
    }
}