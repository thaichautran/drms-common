using System.Collections.Generic;
using OpenGIS.Module.Core.Models.DevExtreme;

namespace OpenGIS.Module.Core.Models.DTO
{
    public class QuickSearchListDxDTO : DxGridDTO
    {
        public string? schema { get; set; }
        public string? keyword { get; set; }
        public string? geom { get; set; }
        public int[]? layer_id { get; set; }
        public int[]? table_id { get; set; }
        public IDictionary<string, object>? @params { get; set; }
        public string? province_code { get; set; }
        public string? district_code { get; set; }
        public string? commune_code { get; set; }
        public int? map_id { get; set; }
        public int? capQuanLy { get; set; }
        public bool? requireBoundary { get; set; }
    }
}