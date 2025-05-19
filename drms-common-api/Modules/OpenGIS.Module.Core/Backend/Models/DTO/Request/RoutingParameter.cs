using System;
using System.Collections.Generic;
using System.Text;
using NetTopologySuite.Geometries;

namespace OpenGIS.Module.Core.Models.DTO.Request
{
    public class RoutingParameter
    {
        public string vehicle_type { get; set; }
        public IEnumerable<Coordinate> way_points { get; set; }
    }
}
