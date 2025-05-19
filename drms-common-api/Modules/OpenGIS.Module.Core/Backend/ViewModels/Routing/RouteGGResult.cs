using System.Collections.Generic;
using OpenGIS.Module.Core.ViewModels.Routing.GoogleFormat;

namespace OpenGIS.Module.Core.ViewModels.Routing
{
    public class RouteGGResult
    {
        public RouteGGResult()
        {
            geocoded_waypoints = new List<GeocodedWaypoint>();
            routes = new List<RouteGoogleFormat>();
        }

        public List<GeocodedWaypoint> geocoded_waypoints { get; set; }
        public List<RouteGoogleFormat> routes { get; set; }
        public string status { get; set; } = "200";
    }
}
