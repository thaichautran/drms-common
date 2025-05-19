using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace OpenGIS.Module.Core.Models.Entities.QLHS
{
    [Table("dm_coquan_banhanh", Schema = "category")]
    public class CoQuanBanHanh
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? mo_ta { get; set; }
    }
}