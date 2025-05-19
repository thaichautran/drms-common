namespace OpenGIS.Module.Core.ViewModels.Routing
{
    public class RouteSegment
    {
        public int seq { get; set; }
        public int id { get; set; }
        public string? st_name { get; set; }
        public int turn_type { get; set; }
        public string? unit { get; set; }
        public float pin_lon { get; set; }
        public float pin_lat { get; set; }
        public float cost { get; set; }
        public string? shape { get; set; }
    }
}
