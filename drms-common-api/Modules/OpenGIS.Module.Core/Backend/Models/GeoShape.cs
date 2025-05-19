using System;
using System.Collections.Generic;
using System.Text;

namespace OpenGIS.Module.Core.Models
{
    public abstract class GeoShape : BaseGeoModel
    {
        public string geom_text { get; set; }
    }
}
