using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace OpenGIS.Module.Core.Models.Entities
{
    [Table("web_options", Schema = "public")]
    public class WebOption
    {
        [Key]
        public string option_name { get; set; } = string.Empty;
        public string option_value { get; set; } = string.Empty;
        public string option_description { get; set; } = string.Empty;
    }
}