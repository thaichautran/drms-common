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
    public class UserGroupByViewModel
    {
        public string id { get; set; }
        public string key { get; set; }
        public long count { get; set; }
    }
}
