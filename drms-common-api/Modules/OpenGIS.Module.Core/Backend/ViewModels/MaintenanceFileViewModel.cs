using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;
namespace OpenGIS.Module.Core.Models
{
    public class MaintenanceFileViewModel
    {
        public int worder_id { get; set; }
        public IFormFile[] files { get; set; }
    }
}
