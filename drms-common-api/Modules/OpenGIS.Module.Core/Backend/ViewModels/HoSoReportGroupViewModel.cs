using Microsoft.AspNetCore.Http.Features;
using OpenGIS.Module.Core.Models.Entities.QLHS;
using System;
using System.Collections.Generic;
using System.Text;
namespace OpenGIS.Module.Core.ViewModels
{
    public class HoSoReportGroupViewModel : ReportGroupViewModel
    { 
        public List<HoSo>? hoSos { get; set; }

    }
    public class HoSoReportDoubleGroupViewModel
    {
        public string? key { get; set; }
        public long count { get; set; }
        public List<HoSoReportGroupViewModel>? items { get; set; }
    }
}
