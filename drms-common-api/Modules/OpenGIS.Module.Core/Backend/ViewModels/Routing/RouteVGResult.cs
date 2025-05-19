using System.Collections.Generic;
using System.Net;
using Microsoft.AspNetCore.Http;

namespace OpenGIS.Module.Core.ViewModels.Routing
{
    public class RouteVGResult
    {
        public RouteVGResult()
        {
            instructions = new List<RouteInstruction>();
            segments = new List<string>();
        }
        public string? description { get; set; }
        public List<RouteInstruction> instructions { get; set; }
        public List<string> segments { get; set; }
        public POI? intersects_start { get; set; }
        public POI? intersects_end { get; set; }
        public float total_length { get; set; }
        public int status_code { get; set; }
    }
}
