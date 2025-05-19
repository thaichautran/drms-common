using System;
using System.Collections.Generic;
using OpenGIS.Module.Core.Models.Entities.Maintenance;


namespace OpenGIS.Module.Core.ViewModels
{
    public class ProblemReportViewModal
    {
        public int pageSize { get; set; }
        public int pageIndex { get; set; }
        public DateTime? ngay_batdau { get; set; }
        public DateTime? ngay_ketthuc { get; set; }
        public int layer_id { get; set; }
    }

    public class ProblemReportDistrictViewModal
    {
        public string? stt { get; set; }
        public string? name_vn { get; set; }
        public string? area_id { get; set; }
        public List<ProblemReportCommuneViewModal>? communes { get; set; }
    }
    public class ProblemReportCommuneViewModal
    {
        public string? stt { get; set; }
        public string? name_vn { get; set; }
        public string? area_id { get; set; }
        public List<ProblemsLocation>? datas { get; set; }
    }
}