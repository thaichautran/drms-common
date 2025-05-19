using System.Collections.Generic;
namespace OpenGIS.Module.Core.ViewModels
{
    public class ReportGroupViewModel
    {
        public string? key { get; set; }
        public double count { get; set; }
        public double sum { get; set; }
        public string unit { get; set; }
        public List<ReportGroupViewModel>? items { get; set; }
    }

    public class ReportGroupDataViewModel
    {
        public long? totalCount { get; set; }
        public List<ReportGroupViewModel>? data { get; set; }
    }
}
