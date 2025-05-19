using Microsoft.AspNetCore.Http;

namespace OpenGIS.Module.Core.ViewModels
{
    public class PhieuGiamSatFileViewModel
    {
        public int phieugiamsat_id { get; set; }

        public string? loaikiemtra { get; set; }
        public IFormFile[]? files { get; set; }
    }
}