using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;
namespace OpenGIS.Module.Core.ViewModels
{
    public class AddLayerByFileViewModel
    {
        public string? schema_name { get; set; }
        public string? layer_name { get; set; }
        public string? geometry { get; set; }
        public IFormFile? file { get; set; }
        public string? importType { get; set; }
    }
}
