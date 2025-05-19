using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OpenGIS.Module.Core.ViewModels
{
    public class DanhMucViewModel
    {
        public int id { get; set; }
        public string? mo_ta { get; set; }
        public string? mo_ta_en { get; set; }
        public int type_id { get; set; }
    }
}