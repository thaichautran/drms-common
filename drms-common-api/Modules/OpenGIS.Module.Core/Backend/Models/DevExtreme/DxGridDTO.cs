using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace OpenGIS.Module.Core.Models.DevExtreme
{
    public class DxGridDTO
    {
        public int skip { get; set; }
        public int take { get; set; }
        public bool requireTotalCount { get; set; } = true;
        public bool requireGroupCount { get; set; } = true;
        public IEnumerable<DxSummary>? totalSummary { get; set; }
        public IEnumerable<DxSummary>? groupSummary { get; set; }
        public IEnumerable<DxGroup>? group { get; set; }

        public string? searchOperation { get; set; }
        public string? searchValue { get; set; }
        public List<DxSortDescriptor>? sort { get; set; } = new List<DxSortDescriptor>();
        public virtual IDictionary<string, object>? userData { get; set; }
        public JToken? filter { get; set; }
    }

    public class DxSortDescriptor
    {
        public bool desc { get; set; } = false;
        public string selector { get; set; } = "";
        public bool isExpanded { get; set; } = false;
    }

    public sealed class DxSummary
    {
        public string? selector { get; set; }
        public string? summaryType { get; set; }
    }
    public sealed class DxGroup
    {
        public string selector { get; set; } = string.Empty;
        public bool desc { get; set; } = false;
        public bool isExpanded { get; set; } = false;
    }

    public class HeThongTichHopThoiGianGridParams : DxGridDTO
    {
        public int? hethong_id { get; set; }
    }
    public class UserAccessLogGridParams : DxGridDTO
    {
        public DateTime? timestamp { get; set; }
        public DateTime? from { get; set; }
        public DateTime? to { get; set; }
        public string? user_name { get; set; }
    }
    public class HoSoGridParams : DxGridDTO
    {
        public int? nhom_hoso_id { get; set; }
        public int? loai_hoso_id { get; set; }
        public DateTime? start_date { get; set; }
        public DateTime? end_date { get; set; }
        public string? keyword { get; set; }
    }

    public class FloodedAreaScriptParams : DxGridDTO
    {
        public double? from_value { get; set; }
        public double? to_value { get; set; }
        public string? province_code { get; set; }
        public string? district_code { get; set; }
        public string? commune_code { get; set; }
        public string? keyword { get; set; }
    }
    public class NotificationParams : DxGridDTO
    {
        public DateTime? from { get; set; }
        public DateTime? to { get; set; }
        public string? user_id { get; set; }
        public string? devices_token { get; set; }
    }
    public class TableHistoryDTO : DxGridDTO
    {
        public int pageIndex { get; set; }
        public int pageSize { get; set; }
        public TableHistoryParams? @params { get; set; }
    }

    public class TableHistoryParams
    {
        public DateTime? from { get; set; }
        public DateTime? to { get; set; }
        public string? user_id { get; set; }
    }

}