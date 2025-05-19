using System;
using System.Collections.Generic;
using OpenGIS.Module.Core.Models.DevExtreme;

namespace OpenGIS.Module.Core.Models.DTO
{
    public class CustomReportListDxDTO : DxGridDTO
    {
        public string? groupBy { get; set; }
        public string? reportType { get; set; }
        public string? groupName { get; set; }
        public int? pageSize { get; set; }
        public int? pageIndex { get; set; }
        public DateTime? dateStart { get; set; }
        public DateTime? dateEnd { get; set; }
        public List<int>? layerIds { get; set; }
        public string? districtCode { get; set; }
        public string? communeCode { get; set; }
        public string? donvitinh { get; set; }
        public string? textSearch { get; set; }
    }
}