
namespace OpenGIS.Module.Core.ViewModels.Routing
{
    public class RouteSegmentInfo
    {
        public string? RoadName {get;set;}
        public double Distance {get;set;}
        public double Duration {get;set;}
        public float Bearing {get;set;}
        public (double lon, double lat) StartPoint { get; set; }
        public (double lon, double lat) EndPoint { get; set; }
    }
}
