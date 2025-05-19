using OpenGIS.Module.Core.Models;
using VietGIS.Infrastructure.Identity.Entities;

namespace OpenGIS.Module.Core.ViewModels
{
    public class LayerStyleViewModel
    {
        public string? style { get; set; }
        public double? anchorX { get; set; }
        public double? anchorY { get; set; }
    }
    public class LayerLabelStyleViewModel
    {
        public string? style { get; set; }
        public bool? is_label_visible { get; set; }
    }
}