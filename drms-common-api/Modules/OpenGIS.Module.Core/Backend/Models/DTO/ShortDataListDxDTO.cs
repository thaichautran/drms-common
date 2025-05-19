using System;
using OpenGIS.Module.Core.Models.DevExtreme;

namespace OpenGIS.Module.Core.Models.DTO
{
    public class ShortDataListDxDTO : DxGridDTO
    {
        public string? q { get; set; }
        public int? table_id { get; set; }
        public string? table_name { get; set; }
        public string? table_schema { get; set; }
        // public string? district_code { get; set; }
        public string[]? district_codes { get; set; }
        public int skip { get; set; } = 0;
        public int take { get; set; } = 50;
    }
}