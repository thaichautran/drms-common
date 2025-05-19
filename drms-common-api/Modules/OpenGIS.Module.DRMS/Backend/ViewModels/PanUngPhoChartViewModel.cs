using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OpenGIS.Module.DRMS.ViewModels
{
    public class PanUngPhoChartViewModel
    {
        public IEnumerable<string>? listProvinceCode { get; set; }
        public IEnumerable<string>? listDistrictCode { get; set; }
        public IEnumerable<string>? listCommuneCode { get; set; }
        public IEnumerable<int>? listLoaiThienTai { get; set; }
        public IEnumerable<int>? listYear { get; set; }
        public int typeChart { get; set; }
    }
    public enum EnumTypeChart : int
    {
        HANHCHINH = 1,
        LOAIHINH = 2,
    }
}