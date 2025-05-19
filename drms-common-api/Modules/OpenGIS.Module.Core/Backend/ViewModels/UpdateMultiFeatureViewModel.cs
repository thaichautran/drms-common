using System;
using System.Collections.Generic;
using System.Text;
namespace OpenGIS.Module.Core.Models
{
    public class UpdateMultiFeatureViewModel
    {
        public string value { get; set; }
        public int[] feature_ids { get; set; }
        public int layer_id { get; set; } 
        public int column_id { get; set; }
    }
}
