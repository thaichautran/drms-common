using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OpenGIS.Module.Core.ViewModels
{
    public class SearchReportViewModel
    {
        public List<IDictionary<string, object>>? filter_params { get; set; }
        public int? page { get; set; }
        public int? page_size { get; set; }
    }
}