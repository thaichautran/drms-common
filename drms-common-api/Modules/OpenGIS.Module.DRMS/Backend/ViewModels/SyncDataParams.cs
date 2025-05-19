using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OpenGIS.Module.DRMS.ViewModels
{
    public class SyncDataParams
    {
        public string? province_code { get; set; }
        public string? district_code { get; set; }
        public string? commune_code { get; set; }
        public int[]? loai_congtrinh_id { get; set; }
    }
}