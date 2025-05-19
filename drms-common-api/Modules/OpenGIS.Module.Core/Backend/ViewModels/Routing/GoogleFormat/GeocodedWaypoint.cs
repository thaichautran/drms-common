using System;
using System.Collections.Generic;
using System.Text;

namespace OpenGIS.Module.Core.ViewModels.Routing.GoogleFormat
{
    public class GeocodedWaypoint
    {
        public string geocoder_status { get; set; }
        public string place_id { get; set; }
        public List<string> types { get; set; }
    }
}
