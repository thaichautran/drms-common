using System;
using System.Collections.Generic;
using System.Text;
namespace OpenGIS.Module.Core.Models
{
    public class ParameterKiemTraThietBi
    {
        public ParameterKiemTraThietBi()
        {
            pageSize = 10;
            pageIndex = 1;
        }
        public string maPMIS { get; set; }
        public string maThietBi { get; set; }
        public bool is_complete { get; set; } = false;
        public int pageIndex { get; set; }
        public int pageSize { get; set; }
        public bool isVanHanh { get; set; }
        public bool isThiNghiem { get; set; }
    }
}
