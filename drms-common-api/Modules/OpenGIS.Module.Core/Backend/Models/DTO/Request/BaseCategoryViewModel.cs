using System;
using System.Collections.Generic;
using System.Text;
using OpenGIS.Module.Core.Models.Entities;

namespace OpenGIS.Module.Core.Models.DTO.Request
{
    public class BaseCategoryViewModel 
    {
        public int id { get; set; }
        public string mo_ta { get; set; }
        public int ParrentId { get; set; }
    }
}
