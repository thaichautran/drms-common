using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace OpenGIS.Module.Core.ViewModels
{
    public class NhapLieuKeHoachKiemTraViewModel
    {
        public string? loaiKiemTra { get; set; }
    }

    public class BieuMauNhapLieuKeHoachKiemTraViewModel
    {
        public int nam_kehoach { get; set; }
        public int kehoach_id { get; set; }
        public int? nhathau { get; set; }
        public IFormFile? file { get; set; }
    }

}