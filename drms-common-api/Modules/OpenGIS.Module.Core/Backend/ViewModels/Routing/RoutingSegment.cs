namespace OpenGIS.Module.Core.ViewModels.Routing
{
    public class RoutingSegment
    {
        public int seq { get; set; }
        public int id { get; set; }
        public string? name { get; set; }
        public double seconds { get; set; }
        public double length_m { get; set; }
        public double azimuth { get; set; }
        public string? encoded { get; set; }
    }
}
