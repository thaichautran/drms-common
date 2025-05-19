using OpenGIS.Module.Core.Models.DevExtreme;
using System.Collections.Generic;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.Core.Models.DTO
{
    public class SearchReportListDxDTO : DxGridDTO
    {
        public string? keyword { get; set; }
        public string? report_name { get; set; }
        public int? map_id { get; set; }
        public int? layer_id { get; set; }
        public IDictionary<string, string>? param { get; set; }
        public IEnumerable<TableColumn>? selectedFields { get; set; }
    }
}