using System.Collections;
using System.Collections.Generic;

namespace OpenGIS.Module.Core.Models.DTO.Request
{
    public class WFSParameter
    {
        public string layers { get; set; } = "";
        public string? classifies { get; set; } = "";
        public int maxFeatures { get; set; } = -1;
        public string bbox { get; set; } = "";
        public double z { get; set; } = 0;
        public string f { get; set; } = "json";
        public string? @params { get; set; }
        public string? layerFilterIds { get; set; }
        public string? filterGeometry { get; set; }
    }
}