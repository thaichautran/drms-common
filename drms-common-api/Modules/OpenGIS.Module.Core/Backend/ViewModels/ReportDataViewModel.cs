using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;
namespace OpenGIS.Module.Core.ViewModels
{
    public class ReportDataViewModel
    {
        public string? description { get; set; }
        public string? detail { get; set; }
        public long? count { get; set; }
        public string? donvitinh { get; set; }
        public string? group_name { get; set; } 
        public double? sum { get; set; }
    }
}
