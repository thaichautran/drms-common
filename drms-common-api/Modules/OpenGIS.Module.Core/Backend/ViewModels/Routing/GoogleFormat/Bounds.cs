using System;
using System.Collections.Generic;
using System.Text;

namespace OpenGIS.Module.Core.ViewModels.Routing.GoogleFormat
{
    public class Bounds
    {
        public Bounds()
        {
            northeast = new CoordinateGoogleFormat();
            southwest = new CoordinateGoogleFormat();
        }
        public CoordinateGoogleFormat northeast { get; set; }
        public CoordinateGoogleFormat southwest { get; set; }
    }
}
