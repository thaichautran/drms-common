using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;

namespace OpenGIS.Module.DRMS.Models.Category
{
    [Table("dm_lop_dulieu", Schema = "category")]
    public class DmLopDulieu : BaseCategory
    {
        [Required]
        public int nhom_dulieu_id { get; set; }
    }
}