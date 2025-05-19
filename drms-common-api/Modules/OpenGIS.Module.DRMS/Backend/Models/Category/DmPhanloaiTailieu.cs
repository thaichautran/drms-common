using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;

namespace OpenGIS.Module.DRMS.Models.Category
{
    [Table("dm_phanloai_tailieu", Schema = "category")]
    public class DmPhanloaiTailieu : BaseCategory
    {
        public int? parent_id { get; set; }
        public int? nhom_tailieu_id { get; set; }
    }
}