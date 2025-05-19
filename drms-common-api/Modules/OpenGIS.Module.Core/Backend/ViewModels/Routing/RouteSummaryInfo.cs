
using System.Collections.Generic;

namespace OpenGIS.Module.Core.ViewModels.Routing
{
    public class RouteSummaryInfo
    {
        public List<RouteSegmentInfo> RouteSegments{ get; set; } = new List<RouteSegmentInfo>();
        public double TotalDistance {get;set;}
        public double TotalDuration {get;set;}
        public string? OverviewRoute {get;set;}
        public string? WKTGeom {get;set;}
    }
}
