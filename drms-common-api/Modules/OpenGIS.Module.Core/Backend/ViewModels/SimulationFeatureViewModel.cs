using OpenGIS.Module.Core.Models;
using VietGIS.Infrastructure.Identity.Entities;

namespace OpenGIS.Module.Core.ViewModels
{
    public class SimulationFeatureViewModel
    {
        public string? uid { get; set; }
        public string id { get; set; }
        public string? name { get; set; }
        public int layer_id { get; set; }
        public string? layer_name { get; set; }
        public int parent_layer_id { get; set; }
        public string? parent_layer_name { get; set; }
        public string? foreign_value { get; set; }
        public string? status { get; set; }
    }
}