using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http;
using OpenGIS.Module.Core.Models.Entities.Category;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.IO;
using System.Text;
using VietGIS.Infrastructure;
using VietGIS.Infrastructure.Models.Database;

namespace OpenGIS.Module.Core.Models.Entities.QLHS
{
    [Table("apis", Schema = "public")]
    public class APIShare
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? description { get; set; }
        public string? path { get; set; }
        public string? method { get; set; }
        public bool is_active { get; set; }
        public bool is_locked { get; set; }
    }
}
