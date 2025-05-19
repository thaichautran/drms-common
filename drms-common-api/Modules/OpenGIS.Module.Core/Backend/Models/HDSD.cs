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
    [Table("hdsd", Schema = "public")]
    public class HDSD
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int id { get; set; }
        public string? tieu_de { get; set; }
        public string? noi_dung { get; set; }
        public int? order_id { get; set; }
        public int title_level { get; set; }
        public int parent_id { get; set; }
    }
}
