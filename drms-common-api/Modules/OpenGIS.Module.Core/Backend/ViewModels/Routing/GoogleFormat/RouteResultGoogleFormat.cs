using System;
using System.Collections.Generic;
using System.Text;

namespace OpenGIS.Module.Core.ViewModels.Routing.GoogleFormat
{
    public class RouteResultGoogleFormat
    {
        public List<GeocodedWaypoint> geocoded_waypoints { get; set; }
        public List<RouteGoogleFormat> routes { get; set; }
        public string status { get; set; }
    }
}
