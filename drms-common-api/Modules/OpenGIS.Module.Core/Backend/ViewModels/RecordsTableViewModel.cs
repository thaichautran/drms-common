using System.Collections.Generic;
using VietGIS.Infrastructure.Models.Database;
using VietGIS.Infrastructure.Models.Database.Map;
using VietGIS.Infrastructure.Models.Regional;

namespace OpenGIS.Module.Core.ViewModels
{
    public class RecordsTableViewModel
    {
        public int? index { get; set; }
        public double? total { get; set; }
        public TableInfo? table { get; set; }
        public IEnumerable<TableColumn>? columns { get; set; }
        public List<IDictionary<string, object>>? records { get; set; }
        public IEnumerable<Province>? provinces { get; set; }
        public IEnumerable<District>? districts { get; set; }
        public IEnumerable<Commune>? communes { get; set; }
        public IDictionary<string, List<DomainViewModel>>? domains { get; set; }
    }
}