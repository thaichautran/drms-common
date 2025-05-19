using Microsoft.EntityFrameworkCore.Metadata.Internal;
using NetTopologySuite.Geometries;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;

namespace OpenGIS.Module.Core.ViewModels
{
    public class SearchFeatureViewModel
    {
        public string? uid { get; set; }
        public object? id { get; set; }
        public string? name { get; set; }
        public int? layer_id { get; set; }
        public Layer? layer { get; set; }
        public int? table_id { get; set; }
        public TableInfo? table { get; set; }
        public string? layer_name { get; set; }
        public string? table_name { get; set; }
        public int? layer_group_id { get; set; }
        public string? layer_group_name { get; set; }
        public string? region { get; set; }
        public Geometry? geometry { get; set; }
    }
}
