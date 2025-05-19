using System;
using System.Collections.Generic;
using System.Text;

namespace OpenGIS.Module.Core.ViewModels.Routing.GoogleFormat
{
    public class RouteGoogleFormat
    {
        public RouteGoogleFormat()
        {
            bounds = new Bounds();
            legs = new List<LegGoogleFormat>();
            overview_polyline = new PolylineGoogleFormat();
            warnings = new List<object>();
            waypoint_order = new List<object>();
        }

        public Bounds bounds { get; set; }
        public string copyrights { get; set; }
        public List<LegGoogleFormat> legs { get; set; }
        public PolylineGoogleFormat overview_polyline { get; set; }
        public string summary { get; set; }
        public List<object> warnings { get; set; }
        public List<object> waypoint_order { get; set; }
    }
}
