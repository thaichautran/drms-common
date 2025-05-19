namespace OpenGIS.Module.Core.ViewModels.Routing
{
    public class RouteInstruction
    {
        public string? st_name { get; set; }
        public string? turn_type { get; set; }
        public float length { get; set; }
        public string? unit { get; set; } = "m";
        public float pin_lng { get; set; }
        public float pin_lat { get; set; }
    }
}
