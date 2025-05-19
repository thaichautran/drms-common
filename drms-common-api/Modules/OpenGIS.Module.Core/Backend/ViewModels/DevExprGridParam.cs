using System;
using System.Collections.Generic;
using OpenGIS.Module.Core.Models.DevExtreme;
using OpenGIS.Module.Core.Models.Entities;

namespace OpenGIS.Module.Core.Models
{
    public class DevExprGridParam
    {
        public int skip { get; set; }
        public int take { get; set; }
    }

    public class GridParameter : DevExprGridParam
    {
        public IDictionary<string, string> parameters { get; set; }
        public string table_schema { get; set; }
        public int layer_id { get; set; }
    }

    public class GridProjectParameter : DevExprGridParam
    {
        public string keyword { get; set; }
    }

    public class GridDocumentParameter : DevExprGridParam
    {
        public string keyword { get; set; }
        public int project_id { get; set; }
    }
}