using System.Collections.Generic;
using OpenGIS.Module.Core.Models.Entities.ThoatNuoc;

namespace OpenGIS.Module.Core.ViewModels
{
    public class FloodedLocationViewModel
    {
        public string? commune_code { get; set; }
        public string? district_code { get; set; }
        public int pageSize { get; set; }
        public int pageIndex { get; set; }
        public string? type { get; set; }
    }
    public class FloodedLocationByDistrictViewModel
    {
        public string? stt { get; set; }
        public string? name_vn { get; set; }
        public string? area_id { get; set; }
        public List<FloodedLocationByCommuneViewModel>? communes { get; set; }
    }
    public class FloodedLocationByCommuneViewModel
    {
        public string? stt { get; set; }
        public string? name_vn { get; set; }
        public string? area_id { get; set; }
        public List<ViTriNgapUng>? datas { get; set; }
    }
}
