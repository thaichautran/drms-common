using Microsoft.AspNetCore.Http;
using OpenGIS.Module.Core.Models.Entities.Maintenance;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace OpenGIS.Module.Core.ViewModels
{
    public class DomainViewModel
    {
        public object id { get; set; }
        public string mo_ta { get; set; }
    }
    public class CategoryViewModel : DomainViewModel
    {
        public string table_name { get; set; }
    }
}
