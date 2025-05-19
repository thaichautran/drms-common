using System;
using System.Collections.Generic;
using System.Text;

namespace OpenGIS.Module.Core.ViewModels.Routing.GoogleFormat
{
    public class LegGoogleFormat
    {
        public LegGoogleFormat()
        {
            distance = new RouteCostGoogleFormat();
            duration = new RouteCostGoogleFormat();
            steps = new List<StepGoogleFormat>();
        }

        public RouteCostGoogleFormat distance { get; set; }
        public RouteCostGoogleFormat duration { get; set; }
        public string end_address { get; set; }
        public CoordinateGoogleFormat end_location { get; set; }
        public string start_address { get; set; }
        public CoordinateGoogleFormat start_location { get; set; }
        public List<StepGoogleFormat> steps { get; set; }
        public List<object> traffic_speed_entry { get; set; }
        public List<object> via_waypoint { get; set; }
    }
}
