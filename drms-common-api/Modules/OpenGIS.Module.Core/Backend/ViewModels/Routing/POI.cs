using System.Collections.Generic;
using OpenGIS.Module.Core.ViewModels.Routing.GoogleFormat;

namespace OpenGIS.Module.Core.ViewModels.Routing
{
    public class POI
    {
        public int id { get; set; }
        public string buaname { get; set; }
        public string st_name { get; set; }
        public string address { get; set; }
        public double lon { get; set; }
        public double lat { get; set; }
    }
}
