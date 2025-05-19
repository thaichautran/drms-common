using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using OpenGIS.Module.DRMS.Models.Category;

namespace OpenGIS.Module.DRMS.Models
{
    [Table("phuongan_thientai", Schema = "drms")]
    public class PhuonganThientai
    {
        [Key]
        [ForeignKey(nameof(phuongAn))]
        public int phuongan_id { get; set; }
        public virtual PanUngphoThientai? phuongAn { get; set; }
        [Key]
        [ForeignKey(nameof(loaiThienTai))]
        public int loai_thientai_id { get; set; }
        public virtual DmLoaiThientai? loaiThienTai { get; set; }
    }
}