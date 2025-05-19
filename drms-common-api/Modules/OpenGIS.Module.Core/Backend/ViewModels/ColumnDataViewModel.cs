using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;
namespace OpenGIS.Module.Core.ViewModels
{
    public class ColumnDataViewModel
    {
        public string? table_name { get; set; }
        public string? column_name { get; set; }
        public string? q { get; set; }
        public int? page { get; set; }
        public int? page_size { get; set; }
    }
}
