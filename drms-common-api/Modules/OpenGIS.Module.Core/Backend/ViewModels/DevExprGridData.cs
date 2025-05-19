using System;
using System.Collections.Generic;
using OpenGIS.Module.Core.Models.Entities;

namespace OpenGIS.Module.Core.Models
{
    public class DevExprGridData
    {
        public List<IDictionary<string, object>>? data { get; set; }
        public long totalCount { get; set; }
        public long groupCount { get; set; }
        public int totalFilter { get; set; }
        public IEnumerable<object>? totalSummary { get; set; }
        public string? boundary { get; set; }
    }

    public class DevExprGridGroupData
    {
        public List<DevExprGridGroupItem>? data { get; set; }
        public List<IDictionary<string, object>>? items { get; set; }
        public long totalCount { get; set; }
        public long groupCount { get; set; }
        public int totalFilter { get; set; }
        public IEnumerable<object>? totalSummary { get; set; }
        public string? boundary { get; set; }
    }

    public class DevExprGridGroupItem
    {
        public string? key { get; set; }
        public long count {get;set;}
        public List<IDictionary<string, object>>? items { get; set; }
        public IEnumerable<object>? summary { get; set; }
    }

    public class DevExprGridSummaryValue
    {
        public string? key { get; set; }
        public double? count { get; set; }
    }
}