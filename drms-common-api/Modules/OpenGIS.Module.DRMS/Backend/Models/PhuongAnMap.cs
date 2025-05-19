using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using VietGIS.Infrastructure.Models.Database.Map;

namespace OpenGIS.Module.DRMS.Models
{
    [Table("phuongan_map", Schema = "drms")]
    public class PhuongAnMap
    {
        [Key]
        [ForeignKey(nameof(phuongAn))]
        public int phuongan_id { get; set; }
        public virtual PanUngphoThientai? phuongAn { get; set; }
        [Key]
        [ForeignKey(nameof(map))]
        public int map_id { get; set; }
        public virtual Map? map { get; set; }
    }
}