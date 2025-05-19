using System;
using System.Collections.Generic;
using System.Text;

namespace OpenGIS.Module.Core.ViewModels.Routing.GoogleFormat
{
    public class StepGoogleFormat
    {
        public RouteCostGoogleFormat distance { get; set; }
        public RouteCostGoogleFormat duration { get; set; }
        public CoordinateGoogleFormat end_location { get; set; }
        public string html_instructions { get; set; }
        public PolylineGoogleFormat polyline { get; set; }
        public CoordinateGoogleFormat start_location { get; set; }
        public float bearing {get;set;}
        public string travel_mode { get; set; }
        public string maneuver { get; set; }
        public string direction {get;set;}
    }
}
