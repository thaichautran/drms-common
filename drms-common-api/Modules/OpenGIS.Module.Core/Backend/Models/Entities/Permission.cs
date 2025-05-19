using Swashbuckle.AspNetCore.Swagger;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("permissions", Schema = "public")]
    public class Permission
    {
        public int id { get; set; }
        public string? permission_name { get; set; }
        public string? permission_value { get; set; }
        public int parent_id { get; set; }
    }
}
