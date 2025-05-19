using System;
using System.Collections.Generic;
using System.Text;
using NetTopologySuite.Geometries;

namespace OpenGIS.Module.Core.Models.DTO.Request
{
    public class CopyLayerParameter
    {
        public int layer_id { get; set; }
        public string? layer_name { get; set; }
        public string? copy_type { get; set; }
        public bool? is_copy_data { get; set; }
        public string? schema_name { get; set; }
    }
}
