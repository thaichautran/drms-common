using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using OpenGIS.Module.Core.Constants;

namespace OpenGIS.Module.DRMS.Models.Category
{
    public class BaseCategory
    {
        [Key]
        [Required]
        public int id { get; set; }
        [Required]
        [StringLength(100)]
        [RegularExpression(Constants.FILTER_EXPRESSION, ErrorMessage = Constants.FILTER_EXPRESSION_ERROR)]
        public string mo_ta { get; set; } = string.Empty;
        public int? order_id { get; set; }

    }
}