using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;
namespace OpenGIS.Module.Core.ViewModels
{
    public class AddSchemaByFileViewModel
    {
        public string? schema_name { get; set; }
        public string? description { get; set; }
        public IFormFile? file { get; set; }
        public IEnumerable<IFormFile>? files { get; set; }
        public string? importType { get; set; }
        public bool? is_replace_alias { get; set; }
        public bool? is_clear_data { get; set; }
    }
}
