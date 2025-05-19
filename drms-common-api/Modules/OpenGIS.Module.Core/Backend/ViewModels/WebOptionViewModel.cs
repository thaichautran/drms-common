using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace OpenGIS.Module.Core.ViewModels
{
    public class WebOptionViewModel
    {
        public IFormFile? logo { get; set; }
        public IFormFile? background { get; set; }
        public string? siteName { get; set; }
        public string? siteDescription { get; set; }
        public string? backupFrequency { get; set; }
        public string? backupSavePath { get; set; }
    }
}