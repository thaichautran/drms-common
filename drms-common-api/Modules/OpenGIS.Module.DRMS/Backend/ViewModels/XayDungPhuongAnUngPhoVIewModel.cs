using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using OpenGIS.Module.DRMS.Models;
using VietGIS.Infrastructure.Models.Database.Map;

namespace OpenGIS.Module.DRMS.ViewModels
{
    public class XayDungPhuongAnUngPhoViewModel
    {
        public PanUngphoThientai? phuongAn { get; set; }
        public Map? map { get; set; }
    }
}