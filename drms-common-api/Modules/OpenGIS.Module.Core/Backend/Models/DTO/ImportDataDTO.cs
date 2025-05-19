using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.Core.Models.DTO
{
    public class ImportDataDTO
    {
        public IFormFile? file { get; set; }
        public int? layerId { get; set; }
        public int? tableId { get; set; }
        public string? type { get; set; }
        public bool? truncateData { get; set; } = false;
    }
}
