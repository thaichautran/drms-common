using OpenGIS.Module.Core.Models;
using System.Collections.Generic;
using VietGIS.Infrastructure.Identity.Entities;

namespace OpenGIS.Module.Core.ViewModels
{
    public class RelationFeatureViewModel
    {
        public string? uid { get; set; }
        public string? id { get; set; }
        public string? name { get; set; }
        public int layer_id { get; set; }
        public string? layer_name { get; set; }
        public int table_id { get; set; }
        public string? table_name { get; set; }
        public string? phanloai { get; set; }
    }

    public class GroupRelationFeatureViewModel
    {
        public string? uid { get; set; }
        public string? id { get; set; }
        public string? name { get; set; }
        public int layer_id { get; set; }
        public int level_child { get; set; }
        public string? group_level_1 { get; set; }
        public string? group_level_2 { get; set; }
        public string? group_level_3 { get; set; }
        public string? group_level_4 { get; set; }
    }
}