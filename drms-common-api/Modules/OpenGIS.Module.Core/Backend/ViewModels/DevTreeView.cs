using System;
using System.Collections.Generic;
using OpenGIS.Module.Core.Models.Entities;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.Core.Models
{
    public class DevTreeView
    {
        public DevTreeView()
        {
            children = new List<DevTreeView>();
        }

        public bool selected { get; set; }
        public object id { get; set; }
        public string text { get; set; }
        public object parentId { get; set; }
        public bool hasItems { get; set; }
        public bool isExpanded { get; set; }
        public List<DevTreeView> children { get; set; }
        public string type { get; set; }
    }
    public class TreeViewExpr
    {
        public TreeViewExpr()
        {
            children = new List<TreeViewExpr>();
        }
        public string id { get; set; }
        public string text { get; set; }
        public string parentId { get; set; }
        public bool hasItems { get; set; }
        public bool isExpanded { get; set; }
        public List<TreeViewExpr> children { get; set; }
        public string geometry { get; set; }
        public string icon { get; set; }
        public string styles { get; set; }
        public int table_info_id { get; set; }
        public IEnumerable<TableColumn> columns { get; set; }
    }

    public class RealtionFeatureTreeView : DevTreeView
    {
        public string? featureId { get; set; }
        public int? layerId { get; set; }
    }
}