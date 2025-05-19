using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using OpenGIS.Module.Core.Models.DevExtreme;
using OpenGIS.Module.Core.Models.Entities;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.Core.Models.DTO
{
    public class SearchDTO
    {
        public SearchDTO()
        {
            this.selectedFields = new List<TableColumn>();
        }
        public IDictionary<string, string>? param { get; set; }
        public IEnumerable<TableColumn>? selectedFields { get; set; }
        public int? pageIndex { get; set; }
        public int? pageSize { get; set; }
    }

    public class SearchReportDTO : SearchDTO
    {
        public string? report_name { get; set; }
        public int? layer_id { get; set; }
        public int? map_id { get; set; }
        public int? report_id { get; set; }
    }

    public class SearchByLogicDTO
    {
        public SearchByLogicDTO()
        {
            this.selectedFields = new List<TableColumn>();
            this.@params = new Dictionary<string, object>();
        }
        public string? keyword
        {
            get; set;
        }
        public int? layer_id { get; set; }
        public int? table_id { get; set; }
        public int? mapId { get; set; }
        public IDictionary<string, object>? @params { get; set; }
        public IEnumerable<TableColumn>? groupFields { get; set; }
        public IEnumerable<TableColumn>? selectedFields { get; set; }
        public int? pageIndex { get; set; }
        public int? pageSize { get; set; }
        public int? skip { get; set; }
        public int? take { get; set; }
        public string? orderby { get; set; }
        public bool? onlyReturnCount { get; set; } = false;
        public bool? requireTotalCount { get; set; } = false;
        public bool? requireBoundary { get; set; } = false;
        public bool? requireGroupCount { get; set; } = false;
        public IEnumerable<TotalSummary>? totalSummary { get; set; }
        public IEnumerable<TotalSummary>? groupSummary { get; set; }
        public IEnumerable<DxGroup>? group { get; set; }
        public IEnumerable<DxSortDescriptor>? sort { get; set; }
        public Form? form { get; set; }
        public BaoCao? report { get; set; }
        public JToken? filter { get; set; }
        public int is_approved { get; set; }

        public sealed class TotalSummary
        {
            public string? selector { get; set; }
            public string? summaryType { get; set; }
        }
    }
    public class ChartDTO : SearchByLogicDTO
    {
        public int? group_column_id { get; set; }
        public int? count_column_id { get; set; }
        public TableColumn? group_date { get; set; }
    }
}
