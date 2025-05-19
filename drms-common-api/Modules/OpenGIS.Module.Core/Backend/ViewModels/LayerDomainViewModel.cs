using System;
using System.Collections.Generic;
using OpenGIS.Module.Core.Models.Entities;

namespace OpenGIS.Module.Core.Models
{
    public class Info
    {
        public string table_name { get; set; }
        public string column_name { get; set; }
        public string foreign_table_name { get; set; }
        public string foreign_table_col { get; set; }
    }
}